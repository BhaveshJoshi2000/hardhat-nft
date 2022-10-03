const { network, ethers } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const { storeImages, storeTokenUriMetadata } = require("../utils/uploadToPinata")

const imagesLocation = "./images/randomNft"
const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_type: "Cuteness",
            value: 100,
        },
    ],
}

let tokenUris = [
    "ipfs://QmNddFsneWThscVTyaTPWoiYAe5X462TSq27Bg2NX6HeWh",
    "ipfs://QmNqYUNjjRDXU4KN1cLA5pUgJ3V4cEVR7VWwDtCh8Awwue",
    "ipfs://Qme7UtrSEuizrnR2wjf2wCmh7YradDvsFicn5ozMrxzc6M",
]

const FUND_AMOUNT = "10000000000000000000"
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = await handleTokenUris()
    }

    let vrfCoordinatorV2Address, subscriptionId, vrfCoordinatorMock
    if (developmentChains.includes(network.name)) {
        vrfCoordinatorMock = await ethers.getContract("VRFCoordinatorV2Mock")

        vrfCoordinatorV2Address = vrfCoordinatorMock.address

        const tx = await vrfCoordinatorMock.createSubscription()

        const txReceipt = await tx.wait(1)

        subscriptionId = txReceipt.events[0].args.subId

        await vrfCoordinatorMock.fundSubscription(subscriptionId, FUND_AMOUNT)
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId][vrfCoordinatorV2]
        subscriptionId = networkConfig[chainId][subscriptionId]
    }

    log("____________________________________")

    const args = [
        vrfCoordinatorV2Address,
        subscriptionId,
        networkConfig[chainId].gasLane,
        networkConfig[chainId].mintFee,
        networkConfig[chainId].callbackGasLimit,
        tokenUris,
    ]

    const randomIpfsNft = await deploy("RandomIpfsNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    await vrfCoordinatorMock.addConsumer(subscriptionId, randomIpfsNft.address)

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("verifying...")
        await verify(randomIpfsNft.address, args)
    }

    log("__________________________________________")
}

async function handleTokenUris() {
    tokenUris = []

    const { responses: imageUploadResponses, files } = await storeImages(imagesLocation)

    for (imageUploadResponseIndex in imageUploadResponses) {
        let tokenUriMetadata = { ...metadataTemplate }

        tokenUriMetadata.name = files[imageUploadResponseIndex].replace(".png", "")
        tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name}`
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`

        console.log(`Uploading ${tokenUriMetadata.name}...`)

        const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata)
        tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
    }
    console.log("Token URIs Uploaded! They are:")
    console.log(tokenUris)
    return tokenUris
}

module.exports.tags = ["all", "randomIpfs", "main"]
