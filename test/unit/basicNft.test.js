const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { networkConfig, developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Basic nft unit test", function () {
          let basicNft, deployer

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])

              basicNft = await ethers.getContract("BasicNft", deployer)
          })

          describe("constructor", function () {
              it("Initializes the token counter as 0", async function () {
                  const tokenCounter = await basicNft.getTokenCounter()
                  assert.equal(tokenCounter, 0)
              })
              it("initializes with correct name and symbol", async function () {
                  const tokenName = await basicNft.name()
                  const tokenSymbol = await basicNft.symbol()

                  assert.equal(tokenName, "Doggie")
                  assert.equal(tokenSymbol, "Dog")
              })
          })

          describe("mintNft", function () {
              it("Allows user to mint their nft tokens", async function () {
                  const txResponse = await basicNft.mintNft()
                  await txResponse.wait(1)

                  const tokenUri = await basicNft.tokenURI(0)
                  assert.equal(tokenUri, await basicNft.TOKEN_URI())
              })
              it("increases the value of token counter", async function () {
                  let initialCounter = await basicNft.getTokenCounter()
                  await basicNft.mintNft()
                  const finalCounter = await basicNft.getTokenCounter()

                  assert.equal(finalCounter, ++initialCounter)
              })
          })
      })
