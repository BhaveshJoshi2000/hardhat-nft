const { network } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")

const GAS_FEE = "2500000000000000000"
const GAS_PRICE_LINK = 1e9

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    log("__________________________________________________")

    if (chainId === 31337) {
        args = [GAS_FEE, GAS_PRICE_LINK]

        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            args: args,
            log: true,
            waitConfirmations: 1,
        })
    }

    log("___________________________________________")
}

module.exports.tags = ["all", "mocks"]
