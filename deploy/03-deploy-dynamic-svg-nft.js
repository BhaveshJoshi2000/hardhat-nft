const { ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const fs = require("fs")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const chainId = network.config.chainId

    let ethUsdPriceFeed

    if (developmentChains.includes(network.name)) {
        const AggregatorV3Interface = await ethers.getContract("MockV3Aggregator")
        ethUsdPriceFeed = AggregatorV3Interface.address
    } else {
        ethUsdPriceFeed = networkConfig[chainId][priceFeedAddress]
    }

    const lowSVG = fs.readFileSync("./images/dynamicNft/frown.svg", { encoding: "utf8" })
    const highSVG = fs.readFileSync("./images/dynamicNft/happy.svg", { encoding: "utf8" })

    const args = [ethUsdPriceFeed, lowSVG, highSVG]

    log("____________________________________________________________________")
    const dynaminNft = await deploy("DynamicSvgNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("verifying...")
        await verify(dynaminNft.address, args)
    }
}

module.exports.tags = ["all", "dynamicSvg", "main"]
