import React from 'react';
import { getItem, getJobConfig } from '../constants';

const slotLabels = { head: '头部', back: '背部', face: '脸部', hand: '左手', leftHand: '左手', rightHand: '右手', legs: '腿部', body: '胸部' };

export default function CharacterAvatar({ job, equipment = {}, weapon = null, size = 'large', background = '' }) {
  const config = getJobConfig(job);
  const leftHand = equipment.leftHand || equipment.hand;
  const overlays = [['back', equipment.back], ['head', equipment.head], ['body', equipment.body], ['face', equipment.face], ['leftHand', leftHand], ['rightHand', equipment.rightHand], ['legs', equipment.legs]].map(([slot, itemId]) => ({ slot, item: getItem(itemId) })).filter(({ item }) => item);
  const activeWeapon = weapon || getItem(equipment.weapon);
  const outfitIds = overlays.map(({ item }) => item.id);
  const workaholicSet = ['overtime-crown', 'black-sunglasses', 'robotic-keyboard', 'giant-milk-tea', 'overtime-suit'].every((id) => outfitIds.includes(id));
  const fishingSet = ['baseball-cap', 'frog-hood', 'handheld-console', 'shorts-slippers'].every((id) => outfitIds.includes(id));
  return (
    <div className={`character-avatar avatar-${size} avatar-${config.color} pose-${job} ${workaholicSet ? 'outfit-workaholic' : ''} ${fishingSet ? 'outfit-fishing' : ''}`} title={`${config.name} · ${config.talent}`}>
      {background && <img className="avatar-background" src={background} alt="" />}
      <span className="stick-figure" aria-hidden="true">
        <i className="stick-head" /><i className="stick-torso" /><i className="stick-arm stick-arm-left" /><i className="stick-arm stick-arm-right" /><i className="stick-leg stick-leg-left" /><i className="stick-leg stick-leg-right" />
      </span>
      {overlays.map(({ slot, item }) => <span className={`avatar-item avatar-item-${slot}`} title={`${slotLabels[slot]}：${item.name}`} key={slot}>{item.iconPath ? <img src={item.iconPath} alt="" /> : item.icon}</span>)}
      {activeWeapon && <span className="avatar-item avatar-item-weapon" title={`武器：${activeWeapon.name}`}>{activeWeapon.iconPath ? <img src={activeWeapon.iconPath} alt="" /> : activeWeapon.icon}</span>}
      <span className="avatar-job-label">{config.name}</span>
    </div>
  );
}
