(window.webpackJsonp=window.webpackJsonp||[]).push([[0],{117:function(e,a,t){e.exports=t(146)},146:function(e,a,t){"use strict";t.r(a);var n=t(44),l=t(0),r=t.n(l),i=t(45),o=t.n(i),s=t(85),c=t(39),m=t(23),u=t(78),d=t(80),g=t(79),p=t(81),E=t(77),f=t(18),b=t(84),h=t(38),w=t(52),v=t(40),j=t.n(v),O=t(37),y={leaguesID:[39,40,61,62,140,135,78,79,144,197,203,88],Leagues:[{id:39,name:"Premier League"},{id:40,name:"Championship"},{id:61,name:"Ligue 1"},{id:62,name:"Ligue 2"},{id:140,name:"La Liga"},{id:135,name:"Serie A"},{id:78,name:"Bundesliga 1"},{id:79,name:"Bundesliga 2"},{id:144,name:"Jupiler Pro League"},{id:203,name:"Toto Super Lig"},{id:88,name:"Euredivise"}]},L=function(){var e=Object(f.b)(),a=e.isOpen,t=e.onOpen,n=e.onClose,l=r.a.useRef();return r.a.createElement(m.a,{theme:h.b},r.a.createElement(r.a.Fragment,null,r.a.createElement(E.a,{ref:l,colorScheme:"teal",onClick:t},"Choisir le Championnat"),r.a.createElement(p.a,{isOpen:a,placement:"left",onClose:n,finalFocusRef:l},r.a.createElement(p.g,null),r.a.createElement(p.d,null,r.a.createElement(p.c,null),r.a.createElement(p.f,null,"Available Leagues"),r.a.createElement(p.b,null,y.Leagues.map(function(e){return r.a.createElement(u.c,{alignItems:"center",pr:"10",key:e.id},r.a.createElement(O.b,{onClick:n,to:"/league?id="+e.id,size:"sm"},r.a.createElement(u.a,{borderRadius:"lg",margin:"6px",p:"10px",bg:"teal.100",maxW:"sm",display:"flex",alignItems:"baseline"},r.a.createElement(u.b,null,r.a.createElement(w.a,{borderRadius:"full",objectFit:"cover",boxSize:"60px",alt:"Premier League",src:"https://media.api-sports.io/football/leagues/"+e.id+".png"}),r.a.createElement(u.g,{pl:"15px",fontSize:"2xl"},e.name)))))})),r.a.createElement(p.e,null,r.a.createElement(E.a,{variant:"outline",mr:3,onClick:n},"Cancel"))))))},C=t(49),S=function(e){var a=Object(l.useState)(!0),t=Object(c.a)(a,2),n=t[0],i=t[1],o=Object(l.useState)(),s=Object(c.a)(o,2),m=s[0],d=s[1],p={method:"GET",url:"https://api-football-v1.p.rapidapi.com/v3/teams/statistics",params:{league:e.league_id,season:2022,team:e.team_id},headers:{"X-RapidAPI-Host":"api-football-v1.p.rapidapi.com","X-RapidAPI-Key":"91eeb26ed8msh8447d341df76518p1a7653jsna3db505351af"}};if(Object(l.useEffect)(function(){j.a.request(p).then(function(e){d(e.data),i(!1)}).catch(function(e){console.error(e)})},[]),n)return r.a.createElement(u.b,null,r.a.createElement(C.a,{size:"xl"}));console.log(m);var E=[];Object.entries(m.response.goals.against.minute).slice(0,3).map(function(e){return E.push(Object.entries(e)[1][1].total)});var f=E.reduce(function(e,a){return e+a},0);E=[],Object.entries(m.response.goals.against.minute).slice(3,6).map(function(e){return E.push(Object.entries(e)[1][1].total)});var b=E.reduce(function(e,a){return e+a},0);E=[],Object.entries(m.response.goals.for.minute).slice(0,3).map(function(e){return E.push(Object.entries(e)[1][1].total)});var h=E.reduce(function(e,a){return e+a},0);E=[],Object.entries(m.response.goals.for.minute).slice(3,6).map(function(e){return E.push(Object.entries(e)[1][1].total)});var v=E.reduce(function(e,a){return e+a},0);return r.a.createElement(u.b,null,r.a.createElement(u.a,{w:"full",rounded:"md",overflow:"hidden"},r.a.createElement(w.a,{h:"120px",w:"full",bg:"black",objectFit:"cover"}),r.a.createElement(u.c,{justify:"center",mt:-12},r.a.createElement(g.a,{size:"xl",src:m.response.team.logo,alt:m.response.team.name,css:{border:"2px solid white"}})),r.a.createElement(u.a,{p:6},r.a.createElement(u.f,{spacing:0,align:"center"},r.a.createElement(u.d,{fontSize:"2xl",fontWeight:500,fontFamily:"body"},m.response.team.name),r.a.createElement(u.g,{color:"gray.500"},"Saison : "+m.response.league.season)),r.a.createElement(u.f,{direction:"row",justify:"center",spacing:6},r.a.createElement(u.f,{spacing:0,align:"center"},r.a.createElement(u.g,{fontWeight:600},"Buts"),r.a.createElement(u.g,{fontWeight:500,color:"gray.600"},"1er mi-Temps : ",f,r.a.createElement("br",null),"2nd mi-Temps : ",b)),r.a.createElement(u.f,{spacing:0,align:"center"},r.a.createElement(u.g,{fontWeight:600},"Buts encaiss\xe9s"),r.a.createElement(u.g,{fontWeight:500,color:"gray.600"},"1er mi-Temps : ",h,r.a.createElement("br",null),"2nd mi-Temps : ",v))))))},T=t(8);new Date;function k(){var e=Object(T.f)().search;return r.a.useMemo(function(){return new URLSearchParams(e)},[e])}function x(){var e=k();return r.a.createElement(O.a,null,r.a.createElement(m.a,null,r.a.createElement(L,null)),r.a.createElement("div",null,r.a.createElement(T.c,null,r.a.createElement(T.a,{path:"/league"},r.a.createElement(P,{league_id:e.get("id")})))))}function P(e){var a=e.league_id,t=k(),n={method:"GET",url:"https://api-football-v1.p.rapidapi.com/v3/standings",params:{league:a=t.get("id"),season:2022},headers:{"X-RapidAPI-Host":"api-football-v1.p.rapidapi.com","X-RapidAPI-Key":"91eeb26ed8msh8447d341df76518p1a7653jsna3db505351af"}},i=Object(l.useState)({error:!1,standings:{get:"standings",parameters:{league:"39",season:"2022"},errors:[],results:1,paging:{current:1,total:1},response:[{league:{id:39,name:"PremierLeague",country:"England",logo:"https://media.api-sports.io/football/leagues/39.png",flag:"https://media.api-sports.io/flags/gb.svg",season:2021,standings:[[{rank:1,team:{id:50,name:"Equipe",logo:""},points:70,goalsDiff:50,group:"PremierLeague",form:"DWWLW",status:"same",description:"Promotion-ChampionsLeague(GroupStage)",all:{played:29,win:0,draw:0,lose:0,goals:{for:0,against:0}},home:{played:14,win:11,draw:1,lose:2,goals:{for:40,against:10}},away:{played:15,win:11,draw:3,lose:1,goals:{for:28,against:8}},update:"2022-03-29T00:00:00+00:00"}]]}}]}}),o=Object(c.a)(i,2),h=o[0],w=o[1],v=Object(f.b)(),O=v.isOpen,y=v.onOpen,L=v.onClose,C=r.a.useState({rank:1,team:{id:50,name:"TeamName",logo:"https://media.api-sports.io/football/teams/50.png"},points:70,goalsDiff:50,group:"PremierLeague",form:"DWWLW",status:"same",description:"Promotion-ChampionsLeague(GroupStage)",all:{played:29,win:22,draw:4,lose:3,goals:{for:68,against:18}},home:{played:14,win:11,draw:1,lose:2,goals:{for:40,against:10}},away:{played:15,win:11,draw:3,lose:1,goals:{for:28,against:8}},update:"2022-03-29T00:00:00+00:00"}),T=Object(c.a)(C,2),x=T[0],P=T[1];Object(l.useEffect)(function(){console.log("The League istance is refreshed with ID : ",a),j.a.request(n).then(function(e){w(function(a){return Object(s.a)({},a,{standings:e.data})})}).catch(function(e){console.error(e)})},[a]),console.log("Received data :",h);var N=h.standings.response[0].league.standings[0];return r.a.createElement(m.a,null,r.a.createElement(u.e,{spacing:"40px"},r.a.createElement(d.a,{variant:"striped",colorScheme:"teal",size:"sm"},r.a.createElement(d.b,null,"Equipe de la ligue ",a),r.a.createElement(d.f,null,r.a.createElement(d.g,null,r.a.createElement(d.e,null),r.a.createElement(d.e,null,"Equipe"),r.a.createElement(d.e,null,"V"),r.a.createElement(d.e,null,"N"),r.a.createElement(d.e,null,"D"),r.a.createElement(d.e,null,"Fiche Info"),r.a.createElement(d.e,{isNumeric:!0},"But marqu\xe9s"),r.a.createElement(d.e,{isNumeric:!0},"1ere MT"),r.a.createElement(d.e,{isNumeric:!0},"2eme MT"),r.a.createElement(d.e,{isNumeric:!0},"Buts encaiss\xe9s"),r.a.createElement(d.e,{isNumeric:!0},"1ere MT"),r.a.createElement(d.e,{isNumeric:!0},"2eme MT"))),r.a.createElement(d.c,null,N.map(function(e,a){return r.a.createElement(d.g,{key:a},r.a.createElement(d.d,null,r.a.createElement(g.a,{size:"sm",name:e.team.name,src:e.team.logo})),r.a.createElement(d.d,null,e.team.name),r.a.createElement(d.d,null,e.all.win),r.a.createElement(d.d,null,e.all.draw),r.a.createElement(d.d,null,e.all.lose),r.a.createElement(d.d,null,r.a.createElement(E.b,{key:e,isRound:!0,variant:"ghost",onClick:function(){return function(e){P(e),y()}(e)},icon:r.a.createElement(b.a,null)})),r.a.createElement(d.d,{isNumeric:!0},e.all.goals.for),r.a.createElement(d.d,{isNumeric:!0},"--"),r.a.createElement(d.d,{isNumeric:!0},"--"),r.a.createElement(d.d,{isNumeric:!0},e.all.goals.against),r.a.createElement(d.d,{isNumeric:!0},"--"),r.a.createElement(d.d,{isNumeric:!0},"--"))}))),r.a.createElement(p.h,{isOpen:O,onClose:L},r.a.createElement(p.n,null),r.a.createElement(p.k,null,r.a.createElement(p.m,null,"undefined"===typeof x.team?"Empty":x.team.name),r.a.createElement(p.j,null),r.a.createElement(p.i,null,r.a.createElement(S,{league_id:a,team_id:x.team.id})),r.a.createElement(p.l,null,r.a.createElement(E.a,{colorScheme:"blue",mr:3,onClick:L},"Close"))))))}var N=function(e){e&&e instanceof Function&&t.e(3).then(t.bind(null,150)).then(function(a){var t=a.getCLS,n=a.getFID,l=a.getFCP,r=a.getLCP,i=a.getTTFB;t(e),n(e),l(e),r(e),i(e)})};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));o.a.render(r.a.createElement(O.a,null,r.a.createElement(l.StrictMode,null,r.a.createElement(n.b,null),r.a.createElement(x,null))),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then(function(e){e.unregister()}).catch(function(e){console.error(e.message)}),N()}},[[117,1,2]]]);
//# sourceMappingURL=main.2f500a6e.chunk.js.map