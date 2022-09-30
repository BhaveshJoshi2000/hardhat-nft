const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Random Nft Unit test", function () {
          let randomIpfsNft, deployer, vrfCoordinator

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["mocks", "randomIpfs"])

              randomIpfsNft = await ethers.getContract("RandomIpfsNft")
              vrfCoordinator = await ethers.getContract("VRFCoordinatorV2Mock")
          })

          describe("constructor", function () {
              it("initializes the contract correctly", async function () {
                  const dogTokenUriZero = await randomIpfsNft.getDogTokenUris(0)
                  const isInitialized = await randomIpfsNft.getInitialized()
                  assert(dogTokenUriZero.includes("ipfs://"))
                  assert.equal(isInitialized, true)
              })
          })

          describe("requestNft", function () {
              it("reverts when eth is not sent for minting", async function () {
                  await expect(randomIpfsNft.requestNft()).to.be.revertedWith(
                      "RandomIpfsNft__NeedMoreEth"
                  )
              })

              it("reverts if payment amount is less than mint fee", async function () {
                  const fee = await randomIpfsNft.getMintFee()

                  await expect(
                      randomIpfsNft.requestNft({ value: fee.sub(ethers.utils.parseEther("0.01")) })
                  ).to.be.revertedWith("RandomIpfsNft__NeedMoreEth()")
              })

              it("emits event when NFT is successfully requested ", async function () {
                  const mintFee = await randomIpfsNft.getMintFee()

                  await expect(randomIpfsNft.requestNft({ value: mintFee.toString() })).to.emit(
                      randomIpfsNft,
                      "NftRequested"
                  )
              })
          })

          describe("fulfillRandomwords", function () {
              it("mints NFT after random number is returned", async function () {
                  await new Promise(async (resolve, reject) => {
                      randomIpfsNft.once("NftMinted", async () => {
                          try {
                              const tokenUri = await randomIpfsNft.getDogTokenUris("0")
                              const tokenCounter = await randomIpfsNft.getTokenCounter()

                              assert.equal(tokenUri.toString().includes("ipfs://"), true)
                              assert.equal(tokenCounter, "1")

                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })

                      try {
                          const fee = await randomIpfsNft.getMintFee()

                          const tx = await randomIpfsNft.requestNft({ value: fee })
                          const txReceipt = await tx.wait(1)

                          await vrfCoordinator.fulfillRandomWords(
                              txReceipt.events[1].args.requestId,
                              randomIpfsNft.address
                          )
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
              })
          })

          describe("getBreedFromModded rng", function () {
              it("will return pug if the value is less than 10", async function () {
                  const output = await randomIpfsNft.getBreedFromModdedRng(9)
                  assert.equal(output.toString(), 0)
              })
              it("will return Shiba_Inu if the value is less than 30", async function () {
                  const output = await randomIpfsNft.getBreedFromModdedRng(29)
                  assert.equal(output.toString(), 1)
              })
              it("will return pug if the value is less than 100", async function () {
                  const output = await randomIpfsNft.getBreedFromModdedRng(99)
                  assert.equal(output.toString(), 2)
              })
              it("will revert when value is greater than 99", async function () {
                  await expect(randomIpfsNft.getBreedFromModdedRng(100)).to.be.revertedWith(
                      "RandomIpfsNft__RangeOutOfBounds()"
                  )
              })
          })
      })
