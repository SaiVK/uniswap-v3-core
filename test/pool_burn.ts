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
  token0 = (await TokenFactory.attach('0x51334AA7ab038AD0477096E6A65EC51e73889081')) as TestERC20;
  token1 = (await TokenFactory.attach('0x51BD17c7924F2f1AC0298111C8Bfb0EB2659A83d')) as TestERC20;
  // console.log("Token0 deployed to address:", token0.address);
  // console.log("Token1 deployed to address:", token1.address);

  const MockTimeUniswapV3PoolFactory = await ethers.getContractFactory('MockTimeUniswapV3Pool');

  const poolAddress = '0xFD9B08768ff2d4C29F012aD855eb97A3c8a2bD07'
  pool = MockTimeUniswapV3PoolFactory.attach(poolAddress) as MockTimeUniswapV3Pool
  // console.log("Pool deployed to address:", pool.address);

  const calleeContractFactory = await ethers.getContractFactory('TestUniswapV3Callee');
  swapTarget = (await calleeContractFactory.attach('0xAa0597f56c2caDc4d5eaB693635ae07108502061')) as TestUniswapV3Callee;
  
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
  
  const {
          liquidity,
          feeGrowthInside0LastX128,
          feeGrowthInside1LastX128,
          tokensOwed1,
          tokensOwed0,
        } = await pool.positions(getPositionKey(wallet.address, minTick, maxTick))

  console.log('Liquidity : ', liquidity);
  // console.log('feeGrowthInside0LastX128 : ', feeGrowthInside0LastX128);
  // console.log('feeGrowthInside1LastX128 : ', feeGrowthInside1LastX128);
  console.log('tokensOwed0 : ', tokensOwed0);
  console.log('tokensOwed1 : ', tokensOwed1);

  // await mint(wallet.address, -240, 0, 10000)
  // await pool.burn(-240, 0, 10000)
  await pool.burn(minTick, maxTick, 100);
  // const { amount0, amount1 } = await pool.callStatic.collect(wallet.address, -240, 0, MaxUint128, MaxUint128)
  const { amount0, amount1 } = await pool.callStatic.collect(wallet.address, minTick, maxTick, MaxUint128, MaxUint128);
  console.log("Amount 0 : ", amount0);
  console.log("Amount 1 : ", amount1);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });