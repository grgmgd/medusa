import {
  MathBN,
  MedusaError,
  isDefined,
  transformPropertiesToBigNumber,
} from "@medusajs/utils"
import { EVENT_STATUS } from "@types"
import { ChangeActionType } from "../action-key"
import { OrderChangeProcessing } from "../calculate-order-change"
import {
  setActionReference,
  unsetActionReference,
} from "../set-action-reference"

OrderChangeProcessing.registerActionType(ChangeActionType.RECEIVE_RETURN_ITEM, {
  isDeduction: true,
  commitsAction: "return_item",
  operation({ action, currentOrder, previousEvents, options }) {
    const existing = currentOrder.items.find(
      (item) => item.id === action.details.reference_id
    )!

    let toReturn = action.details.quantity

    existing.detail.return_received_quantity ??= 0
    existing.detail.return_requested_quantity ??= 0

    existing.detail.return_received_quantity = MathBN.add(
      existing.detail.return_received_quantity,
      toReturn
    )
    existing.detail.return_requested_quantity = MathBN.sub(
      existing.detail.return_requested_quantity,
      toReturn
    )

    setActionReference(existing, action, options)

    if (previousEvents) {
      for (const previousEvent of previousEvents) {
        previousEvent.original_ = JSON.parse(JSON.stringify(previousEvent))

        let ret = MathBN.min(toReturn, previousEvent.details.quantity)
        toReturn = MathBN.sub(toReturn, ret)

        previousEvent.details.quantity = MathBN.sub(
          previousEvent.details.quantity,
          ret
        )

        if (MathBN.lte(previousEvent.details.quantity, 0)) {
          previousEvent.status = EVENT_STATUS.DONE
        }
      }
    }

    return MathBN.mult(existing.unit_price, action.details.quantity)
  },
  revert({ action, currentOrder, previousEvents }) {
    const existing = currentOrder.items.find(
      (item) => item.id === action.details.reference_id
    )!

    existing.detail.return_received_quantity = MathBN.sub(
      existing.detail.return_received_quantity,
      action.details.quantity
    )
    existing.detail.return_requested_quantity = MathBN.add(
      existing.detail.return_requested_quantity,
      action.details.quantity
    )

    unsetActionReference(existing, action)

    if (previousEvents) {
      for (const previousEvent of previousEvents) {
        if (!previousEvent.original_) {
          continue
        }

        previousEvent.details = JSON.parse(
          JSON.stringify(previousEvent.original_.details)
        )
        transformPropertiesToBigNumber(previousEvent.details?.metadata)

        delete previousEvent.original_

        previousEvent.status = EVENT_STATUS.PENDING
      }
    }
  },
  validate({ action, currentOrder }) {
    const refId = action.details?.reference_id
    if (!isDefined(refId)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Details reference ID is required."
      )
    }

    const existing = currentOrder.items.find((item) => item.id === refId)

    if (!existing) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Item ID "${refId}" not found.`
      )
    }

    if (!action.details?.quantity) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Quantity to receive return of item ${refId} is required.`
      )
    }

    const quantityRequested = existing?.detail?.return_requested_quantity || 0

    const greater = MathBN.gt(action.details?.quantity, quantityRequested)
    if (greater) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Cannot receive more items than what was requested to be returned for item ${refId}.`
      )
    }
  },
})
