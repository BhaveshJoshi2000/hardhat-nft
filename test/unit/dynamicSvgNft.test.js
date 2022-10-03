const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Dynamic SVG Unit Test", function () {
          let deployer, aggregator, dynamicSvgNft

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["mocks", "dynamicSvg"])

              dynamicSvgNft = await ethers.getContract("DynamicSvgNft")
              aggregator = await ethers.getContract("MockV3Aggregator")
          })

          describe("constructor", function () {
              it("Initializes the Uris of lowSvg and highSvg", async function () {
                  assert(
                      (await dynamicSvgNft.getLowSvgUri()).includes("data:image/svg+xml;base64,")
                  )

                  assert(
                      (await dynamicSvgNft.getHighSvgUri()).includes("data:image/svg+xml;base64,")
                  )
              })
              it("initializes with correct priceFeed address", async function () {
                  const priceFeedAddress = await dynamicSvgNft.getPriceFeed()
                  const aggregatorAddress = await aggregator.address

                  assert.equal(priceFeedAddress, aggregatorAddress)
              })

              it("initializes with tokenId as 0", async function () {
                  assert.equal(await dynamicSvgNft.getTokenId(), 0)
              })
          })

          describe("mintNft", function () {
              it("Successfully maps the high value entered by user to token id", async function () {
                  const highValue = 100
                  await dynamicSvgNft.mintNft(highValue)

                  assert.equal(await dynamicSvgNft.getHighValueOfTokenId(0), highValue)
              })
              it("Increases the token counter to 1 after NFT is minted", async function () {
                  await dynamicSvgNft.mintNft(100)
                  const finalTokenId = await dynamicSvgNft.getTokenId()

                  assert.equal(finalTokenId.toString(), "1")
              })
              it("emits CreatedNFT event after minting the Nft", async function () {
                  await expect(dynamicSvgNft.mintNft(100)).to.emit(dynamicSvgNft, "CreatedNFT")
              })
          })
      })
