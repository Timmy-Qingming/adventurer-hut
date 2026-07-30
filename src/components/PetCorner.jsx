import React from 'react';

const petMeta = {
  slime_green: { name: '绿史莱姆', icon: '🟢', mood: 'happy', passive: '每小时自动恢复 1 点体力' },
  sleepy_cat: { name: '瞌睡黑猫', icon: '🐈‍⬛', mood: 'sleepy', passive: '深夜任务经验 +10%' },
  fire_baby: { name: '火元素宝宝', icon: '🔥', mood: 'happy', passive: '点击有几率掉落 1-5 金币' },
  ghost_lamp: { name: '幽灵灯', icon: '🏮', mood: 'happy', passive: '黑市商品价格 -5%' },
  dragon_whelp: { name: '幼龙', icon: '🐉', mood: 'happy', passive: '所有属性成长速度 +10%' },
  pixel_bug: { name: '像素虫', icon: '🪲', mood: 'happy', passive: '隐藏彩蛋宠物' },
};

export function getPetMeta(petId) {
  return petMeta[petId] || petMeta.slime_green;
}

export default function PetCorner({ petId, mood, celebrating, onInteract }) {
  const pet = getPetMeta(petId);
  const resting = !petId;
  return (
    <button className={`pet-corner pet-${petId || 'resting'} ${celebrating ? 'celebrating' : ''}`} onClick={onInteract} title={resting ? '宠物正在休息' : `${pet.name}：${pet.passive}`} aria-label={resting ? '宠物正在休息' : `互动 ${pet.name}`}>
      <span className="pet-spark">✦</span>
      <span className="pet-icon">{resting ? '💤' : pet.icon}</span>
      <span className="pet-bubble">{resting ? '休息中' : mood === 'sleepy' ? '呼……' : '陪你冒险'}</span>
      <small>{resting ? '宠物休息中' : pet.name}</small>
    </button>
  );
}
