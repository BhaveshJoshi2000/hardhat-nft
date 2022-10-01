const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")

const GAS_FEE = "2500000000000000000"
const GAS_PRICE_LINK = 1e9

const DECIMALS = "18"
const INITIAL_PRICE = ethers.utils.parseUnits("2000", "ether")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    log("__________________________________________________")
    log("deploying VRFCoordinatorV2")
    if (chainId === 31337) {
        args = [GAS_FEE, GAS_PRICE_LINK]

        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            args: args,
            log: true,
            waitConfirmations: 1,
        })
        log("Deploying Aggregator V3")

        await deploy("MockV3Aggregator", {
            from: deployer,
            args: [DECIMALS, INITIAL_PRICE],
            log: true,
            waitConfirmations: 1,
        })
    }

    log("___________________________________________")
}

module.exports.tags = ["all", "mocks"]
