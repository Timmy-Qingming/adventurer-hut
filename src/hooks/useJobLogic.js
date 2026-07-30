import { useMemo } from 'react';
import { getJobConfig } from '../constants';

export function getStaminaCost(job, taskType) {
  return job === 'mage' && (taskType === '工作' || taskType === '学习') ? 0 : 1;
}

export function getGoldReward(job, taskType, baseReward) {
  return job === 'paladin' && taskType === '运动' ? Math.round(baseReward * 1.5) : baseReward;
}

export function getShopPrice(job, originalPrice) {
  return job === 'mage' ? Math.round(originalPrice * 0.8) : originalPrice;
}

export function getWarningExtensionHours(job) {
  return job === 'ranger' ? 1 : 0;
}

export function getTaskWarningAt(job, createdAt, durationHours = 24) {
  return createdAt + (durationHours - 1 + getWarningExtensionHours(job)) * 60 * 60 * 1000;
}

export function useJobLogic(job) {
  return useMemo(() => {
    const config = getJobConfig(job);
    return {
      config,
      getStaminaCost: (taskType) => getStaminaCost(job, taskType),
      getGoldReward: (taskType, baseReward) => getGoldReward(job, taskType, baseReward),
      getShopPrice: (originalPrice) => getShopPrice(job, originalPrice),
      getWarningExtensionHours: () => getWarningExtensionHours(job),
      getTaskWarningAt: (createdAt, durationHours) => getTaskWarningAt(job, createdAt, durationHours),
    };
  }, [job]);
}
