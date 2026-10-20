// Every beat of the ad, in seconds. Shared by the 3D scene, the phone UI and the HTML overlays.
export const T = {
  dur: 56,
  // hook + living room
  hookEnd: 3.0, roomEnd: 7.0,
  // phone order screen
  phoneUp: 6.4, uiAppear: 7.3, typeA: 8.3, typeB: 9.2, chip: 10.0, chip2: 10.8, press: 11.9, sent: 12.15,
  // the letter's journey
  letterGo: 12.7, letterEnd: 19.5,
  // workshop
  elfRead: 19.6, holo: 20.2, bikeShot: 21.8, bikeHit: 22.8, loomShot: 23.6, weave: 24.1, scrollIn: 24.9, scrollRoll: 25.3, convStart: 25.7, convEnd: 27.0,
  // studio
  santaTake: 27.2, santaRead: 27.8, rec: 29.2, clap: 29.7, pushIn: 29.9,
  voice: 31.0, voiceEnd: 39.2, wink: 39.35,
  // delivery + reaction
  pullOut: 39.9, orbGo: 40.3, orbHome: 43.5, notif: 43.9, ugc: 44.3, react: 45.1, parentsLook: 47.9,
  // call to action
  cta: 49.8, tag: 50.5, button: 52.2,
};
