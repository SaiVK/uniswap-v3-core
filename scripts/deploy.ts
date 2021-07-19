import { ethers } from "hardhat";

async function main() {
  const UniswapFactory = await ethers.getContractFactory("UniswapV3Factory");
   
  // Start deployment, returning a promise that resolves to a contract object
  const contract = await UniswapFactory.deploy();   
  console.log("Contract deployed to address:", contract.address);
  // The transaction that was sent to the network to deploy the Contract
  console.log(contract.deployTransaction.hash);
  // The contract is NOT deployed yet; we must wait until it is mined
  await contract.deployed();
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });