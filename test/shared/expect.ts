import {expect, use} from 'chai';
// import use from 'chai';
import { solidity } from 'ethereum-waffle'
import { jestSnapshotPlugin } from 'mocha-chai-jest-snapshot'
// import chai from "chai";
// import chaiString from "chai-string";

use(solidity)
use(jestSnapshotPlugin())

export { expect }
