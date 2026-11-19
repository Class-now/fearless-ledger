// Champion names with the roles they are commonly drafted into in pro play.
// Names only: no images, splash art or icons are used anywhere in the app.
// Roles: T = top, J = jungle, M = mid, B = bot, S = support.
window.FL_CHAMPIONS = (function () {
  'use strict';
  const raw = `
Aatrox:T|Ahri:M|Akali:M,T|Akshan:M|Alistar:S|Ambessa:T,M|Amumu:J,S|Anivia:M|Annie:M,S|Aphelios:B|Ashe:B,S|Aurelion Sol:M|Aurora:M,T|Azir:M
Bard:S|Bel'Veth:J|Blitzcrank:S|Brand:S,J|Braum:S|Briar:J|Caitlyn:B|Camille:T,S|Cassiopeia:M,T|Cho'Gath:T,M|Corki:M,B
Darius:T|Diana:J,M|Dr. Mundo:T,J|Draven:B|Ekko:J,M|Elise:J|Evelynn:J|Ezreal:B|Fiddlesticks:J|Fiora:T|Fizz:M|Galio:M,S|Gangplank:T|Garen:T
Gnar:T|Gragas:J,T,S|Graves:J|Gwen:T,J|Hecarim:J|Heimerdinger:M,S|Hwei:M,S|Illaoi:T|Irelia:T,M|Ivern:J|Janna:S|Jarvan IV:J|Jax:T,J|Jayce:T,M
Jhin:B|Jinx:B|K'Sante:T|Kai'Sa:B|Kalista:B|Karma:S,M|Karthus:J|Kassadin:M|Katarina:M|Kayle:T|Kayn:J|Kennen:T|Kha'Zix:J|Kindred:J|Kled:T
Kog'Maw:B|LeBlanc:M|Lee Sin:J|Leona:S|Lillia:J|Lissandra:M|Lucian:B,M|Lulu:S|Lux:S,M|Malphite:T|Malzahar:M|Maokai:J,S,T|Master Yi:J
Mel:M,S|Milio:S|Miss Fortune:B|Mordekaiser:T|Morgana:S|Naafiri:M|Nami:S|Nasus:T|Nautilus:S|Neeko:M,S|Nidalee:J|Nilah:B|Nocturne:J|Nunu & Willump:J
Olaf:J,T|Orianna:M|Ornn:T|Pantheon:T,S,J|Poppy:J,S,T|Pyke:S|Qiyana:M,J|Quinn:T|Rakan:S|Rammus:J|Rek'Sai:J|Rell:S|Renata Glasc:S|Renekton:T|Rengar:J,T
Riven:T|Rumble:T,M|Ryze:M,T|Samira:B|Sejuani:J|Senna:S,B|Seraphine:S,B|Sett:T,S|Shaco:J|Shen:T|Shyvana:J|Singed:T|Sion:T|Sivir:B|Skarner:J,T
Smolder:B,M|Sona:S|Soraka:S|Swain:S,M|Sylas:M,J|Syndra:M|Tahm Kench:S,T|Taliyah:J,M|Talon:M,J|Taric:S|Teemo:T|Thresh:S|Tristana:M,B|Trundle:J,T
Tryndamere:T|Twisted Fate:M|Twitch:B|Udyr:J|Urgot:T|Varus:B|Vayne:B,T|Veigar:M|Vel'Koz:S,M|Vex:M|Vi:J|Viego:J|Viktor:M|Vladimir:M,T|Volibear:J,T
Warwick:J|Wukong:J,T|Xayah:B|Xerath:S,M|Xin Zhao:J|Yasuo:M,B|Yone:M,T|Yorick:T|Yunara:B|Yuumi:S|Zac:J|Zed:M|Zeri:B|Ziggs:B,M|Zilean:S|Zoe:M|Zyra:S
`;
  return raw.trim().split(/[|\n]/).map(function (entry) {
    const parts = entry.trim().split(':');
    return { name: parts[0], roles: parts[1].split(',') };
  });
})();
