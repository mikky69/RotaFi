import PolUSDCDoc from "./PolUSDC.json";
import RotaFiFactoryDoc from "./RotaFiFactory.json";
import RotaFiCircleDoc from "./RotaFiCircle.json";
import deployments from "./deployments.json";

export const PolUSDCABI = PolUSDCDoc.abi;
export const RotaFiFactoryABI = RotaFiFactoryDoc.abi;
export const RotaFiCircleABI = RotaFiCircleDoc.abi;

export const ADDRESSES = {
  PolUSDC: import.meta.env.VITE_USDC_ADDRESS || deployments.PolUSDC,
  RotaFiFactory: import.meta.env.VITE_CIRCLE_FACTORY_ADDRESS || deployments.RotaFiFactory,
};
