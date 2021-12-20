const path = require("path")

const setupServer = require("../../../helpers/setup-server")
const { useApi } = require("../../../helpers/use-api")
const { initDb, useDb } = require("../../../helpers/use-db")

const {
  simpleProductTaxRateFactory,
  simpleShippingTaxRateFactory,
  simpleShippingOptionFactory,
  simpleCartFactory,
  simpleRegionFactory,
  simpleProductFactory,
} = require("../../factories")

jest.setTimeout(30000)

describe("Manual Cart Taxes", () => {
  let medusaProcess
  let dbConnection

  const doAfterEach = async () => {
    const db = useDb()
    return await db.teardown()
  }

  beforeAll(async () => {
    const cwd = path.resolve(path.join(__dirname, "..", ".."))
    try {
      dbConnection = await initDb({ cwd })
      medusaProcess = await setupServer({ cwd })
    } catch (error) {
      console.log(error)
    }
  })

  afterAll(async () => {
    const db = useDb()
    await db.shutdown()
    medusaProcess.kill()
  })

  afterEach(async () => {
    return await doAfterEach()
  })

  test("manual taxes; default tax rate", async () => {
    await simpleProductFactory(
      dbConnection,
      {
        id: "test-product",
        variants: [
          {
            id: "test-variant",
          },
        ],
      },
      100
    )

    await simpleCartFactory(
      dbConnection,
      {
        id: "test-cart",
        region: {
          id: "test-region",
          name: "Test region",
          tax_rate: 0.12,
          automatic_taxes: false,
        },
        line_items: [
          {
            variant_id: "test-variant",
            unit_price: 100,
          },
        ],
      },
      100
    )

    const api = useApi()

    const response = await api.get("/store/carts/test-cart")
    expect(response.status).toEqual(200)
    expect(response.data.cart.tax_total).toEqual(null)
    expect(response.data.cart.total).toEqual(100)
  })

  test("manual taxes; always forces taxes for payment sessions", async () => {
    await simpleProductFactory(
      dbConnection,
      {
        id: "test-product",
        variants: [
          {
            id: "test-variant",
          },
        ],
      },
      100
    )

    await simpleCartFactory(
      dbConnection,
      {
        id: "test-cart",
        region: {
          id: "test-region",
          name: "Test region",
          tax_rate: 0.12,
          automatic_taxes: false,
        },
        line_items: [
          {
            variant_id: "test-variant",
            unit_price: 100,
          },
        ],
      },
      100
    )

    const api = useApi()

    const response = await api.post("/store/carts/test-cart/payment-sessions")
    expect(response.status).toEqual(200)
    const [paySession] = response.data.cart.payment_sessions
    expect(paySession.data.tax_total).toEqual(12)
    expect(paySession.data.total).toEqual(112)
  })

  // test("automatic taxes; default tax rate w. shipping", async () => {
  //   await simpleProductFactory(
  //     dbConnection,
  //     {
  //       id: "test-product",
  //       variants: [
  //         {
  //           id: "test-variant",
  //         },
  //       ],
  //     },
  //     100
  //   )

  //   await simpleCartFactory(
  //     dbConnection,
  //     {
  //       id: "test-cart",
  //       region: {
  //         id: "test-region",
  //         name: "Test region",
  //         tax_rate: 0.12,
  //       },
  //       shipping_methods: [
  //         {
  //           shipping_option: {
  //             name: "random",
  //             region_id: "test-region",
  //           },
  //           price: 100,
  //         },
  //       ],
  //       line_items: [
  //         {
  //           variant_id: "test-variant",
  //           unit_price: 100,
  //         },
  //       ],
  //     },
  //     100
  //   )

  //   const api = useApi()

  //   const response = await api.get("/store/carts/test-cart")
  //   expect(response.status).toEqual(200)
  //   expect(response.data.cart.tax_total).toEqual(24)
  //   expect(response.data.cart.total).toEqual(224)
  // })

  // test("automatic taxes; tax rate override", async () => {
  //   const product = await simpleProductFactory(
  //     dbConnection,
  //     {
  //       variants: [
  //         {
  //           id: "test-variant",
  //         },
  //       ],
  //     },
  //     100
  //   )

  //   const region = await simpleRegionFactory(dbConnection, {
  //     name: "Test region",
  //     tax_rate: 0.12,
  //   })

  //   await simpleProductTaxRateFactory(dbConnection, {
  //     product_id: product.id,
  //     rate: {
  //       region_id: region.id,
  //       rate: 0.25,
  //     },
  //   })

  //   const cart = await simpleCartFactory(
  //     dbConnection,
  //     {
  //       region: region.id,
  //       line_items: [
  //         {
  //           variant_id: "test-variant",
  //           unit_price: 100,
  //         },
  //       ],
  //     },
  //     100
  //   )

  //   const api = useApi()

  //   const response = await api.get(`/store/carts/${cart.id}`)
  //   expect(response.status).toEqual(200)
  //   expect(response.data.cart.tax_total).toEqual(25)
  //   expect(response.data.cart.total).toEqual(125)
  // })

  // test("automatic taxes; tax rate override w. shipping", async () => {
  //   await simpleProductFactory(
  //     dbConnection,
  //     {
  //       variants: [
  //         {
  //           id: "test-variant",
  //         },
  //       ],
  //     },
  //     100
  //   )

  //   const region = await simpleRegionFactory(dbConnection, {
  //     name: "Test region",
  //     tax_rate: 0.12,
  //   })

  //   const option = await simpleShippingOptionFactory(dbConnection, {
  //     name: "random",
  //     region_id: region.id,
  //   })

  //   await simpleShippingTaxRateFactory(dbConnection, {
  //     shipping_option_id: option.id,
  //     rate: {
  //       region_id: region.id,
  //       rate: 0.25,
  //     },
  //   })

  //   const cart = await simpleCartFactory(
  //     dbConnection,
  //     {
  //       region: region.id,
  //       line_items: [
  //         {
  //           variant_id: "test-variant",
  //           unit_price: 100,
  //         },
  //       ],
  //       shipping_methods: [
  //         {
  //           shipping_option: option.id,
  //           price: 100,
  //         },
  //       ],
  //     },
  //     100
  //   )

  //   const api = useApi()

  //   const response = await api.get(`/store/carts/${cart.id}`)
  //   expect(response.status).toEqual(200)
  //   expect(response.data.cart.tax_total).toEqual(37)
  //   expect(response.data.cart.total).toEqual(237)
  // })

  // test("automatic taxes; multiple tax rate overrides", async () => {
  //   const product1 = await simpleProductFactory(
  //     dbConnection,
  //     {
  //       variants: [
  //         {
  //           id: "test-variant",
  //         },
  //       ],
  //     },
  //     100
  //   )

  //   const product2 = await simpleProductFactory(
  //     dbConnection,
  //     {
  //       variants: [
  //         {
  //           id: "test-variant-2",
  //         },
  //       ],
  //     },
  //     100
  //   )

  //   const region = await simpleRegionFactory(dbConnection, {
  //     name: "Test region",
  //     tax_rate: 0.12,
  //   })

  //   await simpleProductTaxRateFactory(dbConnection, {
  //     product_id: product1.id,
  //     rate: {
  //       region_id: region.id,
  //       rate: 0.25,
  //     },
  //   })

  //   await simpleProductTaxRateFactory(dbConnection, {
  //     product_id: product2.id,
  //     rate: {
  //       region_id: region.id,
  //       rate: 0.2,
  //     },
  //   })

  //   const cart = await simpleCartFactory(
  //     dbConnection,
  //     {
  //       region: region.id,
  //       line_items: [
  //         {
  //           variant_id: "test-variant",
  //           unit_price: 100,
  //         },
  //         {
  //           variant_id: "test-variant-2",
  //           unit_price: 50,
  //         },
  //       ],
  //     },
  //     100
  //   )

  //   const api = useApi()

  //   const response = await api.get(`/store/carts/${cart.id}`)

  //   expect(response.status).toEqual(200)
  //   expect(response.data.cart.tax_total).toEqual(35)
  //   expect(response.data.cart.total).toEqual(185)
  // })
})
