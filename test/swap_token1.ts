import { ethers, waffle } from 'hardhat'
import { BigNumber, BigNumberish, constants, Wallet } from 'ethers'
import { TestERC20 } from '../typechain/TestERC20'
import { UniswapV3Factory } from '../typechain/UniswapV3Factory'
import { MockTimeUniswapV3Pool } from '../typechain/MockTimeUniswapV3Pool'
import { TestUniswapV3SwapPay } from '../typechain/TestUniswapV3SwapPay'
import checkObservationEquals from './shared/checkObservationEquals'
import { TestUniswapV3Callee } from '../typechain/TestUniswapV3Callee'
import { TestUniswapV3Router } from '../typechain/TestUniswapV3Router'
import { MockTimeUniswapV3PoolDeployer } from '../typechain/MockTimeUniswapV3PoolDeployer'
// import { expect } from './shared/expect'

import { poolFixture, TEST_POOL_START_TIME } from './shared/fixtures'

import {
  expandTo18Decimals,
  FeeAmount,
  getPositionKey,
  getMaxTick,
  getMinTick,
  encodePriceSqrt,
  TICK_SPACINGS,
  createPoolFunctions,
  SwapFunction,
  MintFunction,
  getMaxLiquidityPerTick,
  FlashFunction,
  MaxUint128,
  MAX_SQRT_RATIO,
  MIN_SQRT_RATIO,
  SwapToPriceFunction,
} from './shared/utilities'

import { TestUniswapV3ReentrantCallee } from '../typechain/TestUniswapV3ReentrantCallee'
import { TickMathTest } from '../typechain/TickMathTest'
import { SwapMathTest } from '../typechain/SwapMathTest'

const createFixtureLoader = waffle.createFixtureLoader

type ThenArg<T> = T extends PromiseLike<infer U> ? U : T

  let wallet: Wallet, other: Wallet

  let token0: TestERC20
  let token1: TestERC20
  let token2: TestERC20

  let factory: UniswapV3Factory
  let pool: MockTimeUniswapV3Pool

  let swapTarget: TestUniswapV3Callee

  let swapToLowerPrice: SwapToPriceFunction
  let swapToHigherPrice: SwapToPriceFunction
  let swapExact0For1: SwapFunction
  let swap0ForExact1: SwapFunction
  let swapExact1For0: SwapFunction
  let swap1ForExact0: SwapFunction

  let feeAmount: number
  let tickSpacing: number

  let minTick: number
  let maxTick: number

  let mint: MintFunction
  let flash: FlashFunction

  let loadFixture: ReturnType<typeof createFixtureLoader>
  let createPool: ThenArg<ReturnType<typeof poolFixture>>['createPool']

async function main() {
  [wallet, other] = await (ethers as any).getSigners();

  const factoryFactory = await ethers.getContractFactory('UniswapV3Factory');
  factory = (await factoryFactory.attach('0xeD59E0B12aA739d346Fc5116c46f9cD4E6C7012c')) as UniswapV3Factory;
  
  const TokenFactory = await ethers.getContractFactory('TestERC20');
  token0 = (await TokenFactory.attach('0xFD065DBFdE9B10AB262e818B9aE9b3594E87b638')) as TestERC20;
  token1 = (await TokenFactory.attach('0x86E81Ff1418102CCe7EfaAc2DBb7B6aF85a2F9CF')) as TestERC20;
  // console.log("Token0 deployed to address:", token0.address);
  // console.log("Token1 deployed to address:", token1.address);

  const MockTimeUniswapV3PoolFactory = await ethers.getContractFactory('MockTimeUniswapV3Pool');

  const poolAddress = '0x980849165ce14b61eDc3FE13156Bb0Bf731F51E4'
  pool = MockTimeUniswapV3PoolFactory.attach(poolAddress) as MockTimeUniswapV3Pool
  // console.log("Pool deployed to address:", pool.address);

  const calleeContractFactory = await ethers.getContractFactory('TestUniswapV3Callee');
  swapTarget = (await calleeContractFactory.attach('0xBE2FB358Ebc82E80CbE6A295079D4d96F19e403a')) as TestUniswapV3Callee;
   
  // console.log("SwapTarget deployed to address:", swapTarget.address);

  ({
        swapToLowerPrice,
        swapToHigherPrice,
        swapExact0For1,
        swap0ForExact1,
        swapExact1For0,
        swap1ForExact0,
        mint,
        flash,
      } = createPoolFunctions({
        token0,
        token1,
        swapTarget,
        pool,
      }))

  minTick = getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]);
  maxTick = getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]);
  
  const amount1In = BigNumber.from(10);
  await swapExact1For0(amount1In, wallet.address);

  console.log("Swapped 10 TokenB's");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });