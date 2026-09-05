import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {localTypeScriptLoader} from './lib/load-local-typescript.mjs';
const data=new Map(),events=[],writes=[];let readFail=false,writeFail=false;
const storage={getItem:key=>{if(readFail)throw Error('denied');return data.get(key)??null;},setItem:(key,value)=>{if(writeFail)throw Error('quota');writes.push({key,value});data.set(key,value);}};
const load=localTypeScriptLoader({localStorage:storage,window:{dispatchEvent:event=>events.push({type:event.type,snapshot:Object.fromEntries(data)})}});
const compass=load('src/lib/compassRecords.ts'),meta=load('src/lib/localProjectMetadata.ts').localProjectMetadata,route=load('src/lib/personalRoutePlan.ts'),reading=load('src/lib/articleProgress.ts'),bookmarks=load('src/lib/bookmarks.ts'),resume=load('src/lib/resumeBuilderData.ts');
const normalize=x=>JSON.parse(JSON.stringify(x));let count=0;
const check=(name,fn)=>{data.clear();events.length=0;writes.length=0;readFail=false;writeFail=false;fn();console.log(`PASS ${++count}: ${name}`);};
const snapshot=()=>compass.readCompassRecords(()=>storage,new Date('2026-09-05T00:00:00Z'));
const find=(records,href)=>records.items.find(item=>item.href===href);
const plan=()=>({stage:'prepare',concern:'admin',stageLabel:'출국 준비 중',concernLabel:'비자·필수 절차',steps:[{href:'/visa-preparation-guide',title:'비자 준비'},{href:'/arrival-checklist',title:'도착 준비'},{href:'/help-directory',title:'도움 연락처'}],completed:['/visa-preparation-guide'],savedAt:'2026-09-01T00:00:00Z'});
check('all five metadata ID lists match actual page groups, including arrival18',()=>{
 const vars={'visa-preparation-project':'visaGroups','arrival-first-30-days':'groups','house-hunt-project':'houseHuntGroups','moving-project':'movingGroups','leaving-australia-project':'departureGroups'};
 for(const entry of meta){const source=ts.createSourceFile(entry.href,fs.readFileSync(`src/app${entry.href}/page.tsx`,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let initializer;function walk(n){if(ts.isVariableDeclaration(n)&&n.name.getText(source)===vars[entry.key])initializer=n.initializer;ts.forEachChild(n,walk);}walk(source);assert(initializer);const ids=[];function read(n){if(ts.isPropertyAssignment(n)&&n.name.getText(source)==='id')ids.push(n.initializer.text);ts.forEachChild(n,read);}read(initializer);assert.deepEqual(normalize(entry.ids),ids);}
 assert.equal(meta.find(v=>v.key==='arrival-first-30-days').ids.length,18);
});
check('one corrupt personal plan does not hide two valid projects and is read-only',()=>{
 data.set(route.personalPlanKey,JSON.stringify({...plan(),steps:[null]}));for(const entry of meta.slice(0,2))data.set(entry.key,JSON.stringify({checked:[entry.ids[0]],targetDate:''}));const before=[...data];const result=snapshot();assert.equal(find(result,route.savedPlanHref).status,'invalid');assert.equal(result.items.filter(item=>item.active).length,2);assert.deepEqual([...data],before);assert.equal(writes.length,0);
});
check('missing and unavailable storage are distinct for every summary',()=>{
 assert(snapshot().items.every(item=>item.status==='missing'));readFail=true;const result=snapshot();assert(result.items.every(item=>item.status==='unavailable'));assert.equal(result.bookmarks.status,'unavailable');assert.equal(result.reading.status,'unavailable');assert.equal(writes.length,0);
});
check('duplicate/unknown project checks and impossible dates never count as complete',()=>{
 for(const patch of [{checked:['finder','finder']},{checked:['unknown']},{targetDate:'2026-02-30'}]){data.set('visa-preparation-project',JSON.stringify({checked:[],targetDate:'',...patch}));assert.equal(find(snapshot(),'/visa-preparation-guide').status,'invalid');}
});
check('13 and 24 months across FYs produce facts, never a percentage or completion claim',()=>{
 for(const months of [13,24]){const records=Array.from({length:months},(_,i)=>({id:`t${i}`,date:`${2025+Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')}-01`,kind:'income',category:'Pay',description:'Synthetic',amount:1,evidence:'missing',createdAt:'2026-09-01T00:00:00.000Z'}));data.set('hoju-compass-tax-prep-records-v1',JSON.stringify(records));const result=find(snapshot(),'/tax-prep-tracker');assert.equal(result.status,'valid');assert.equal(result.progress,undefined);assert(result.detail.includes('2026–27 FY'));assert(result.detail.includes('다른 FY'));assert(!result.detail.includes('%'));}
});
check('invalid tax rows, duplicate checklist IDs, null jobs and negative savings are review items',()=>{
 for(const [key,href,value] of [['hoju-compass-tax-prep-records-v1','/tax-prep-tracker',[null]],['aussie-compass-tax-return-checklist-v1','/tax-return-guide',['records','records']],['aussie-compass-job-tracker-v1','/job-application-tracker',[null]],['aussie-compass-savings-goal-v1','/savings-goal-calculator',{target:-1}]]){data.set(key,JSON.stringify(value));const result=find(snapshot(),href);assert.equal(result.status,'invalid');assert.equal(result.active,false);}
});
check('empty valid arrays and empty projects are not active work; savings is not bank-balance progress',()=>{
 for(const key of ['aussie-compass-job-tracker-v1','hoju-compass-tax-prep-records-v1','aussie-compass-life-reminders-v1'])data.set(key,'[]');assert.equal(snapshot().items.filter(item=>item.active).length,0);
 data.set('aussie-compass-savings-goal-v1',JSON.stringify({goalName:'Private goal',target:100,starting:50,contribution:1,frequency:'weekly',annualRate:0,targetMonths:12,mode:'timeline',checkIns:[]}));const result=find(snapshot(),'/savings-goal-calculator');assert.equal(result.status,'valid');assert.equal(result.progress,undefined);assert(!result.detail.includes('50'));assert(result.detail.includes('현재 은행 잔액'));
});
check('resume summary shares WEB38 trim/any-role/skill-token completion without PII',()=>{
 const r=normalize(resume.emptyResume);Object.assign(r,{name:'PRIVATE NAME',title:'T',phone:'PRIVATE PHONE',email:'private@example.test',summary:'S',skills:',\n,'});r.experiences.push({...r.experiences[0],id:'second',role:'Actual role'});data.set('aussie-compass-resume-v1',JSON.stringify(r));assert(find(snapshot(),'/resume-builder').detail.includes('6/7'));r.skills='One\nTwo';data.set('aussie-compass-resume-v1',JSON.stringify(r));const result=find(snapshot(),'/resume-builder');assert.equal(result.progress,100);assert(!JSON.stringify(result).includes('PRIVATE'));assert(!JSON.stringify(result).includes('private@example'));
});
check('plan validates whole schema, known routes, labels, timestamp and completed subset',()=>{
 assert.deepEqual(normalize(route.parsePersonalPlan(JSON.stringify(plan()))),plan());
 for(const patch of [{steps:[null]},{stageLabel:{}},{stage:'other'},{completed:['/help-directory','/help-directory']},{completed:['/unknown']},{savedAt:'not-date'},{steps:[{href:'//evil.test',title:'Bad'}]}])assert.equal(route.parsePersonalPlan(JSON.stringify({...plan(),...patch})),null);
 const longer={...plan(),steps:route.routeToolHrefs.map(href=>({href,title:'Long title '.repeat(100)}))};assert.equal(route.parsePersonalPlan(JSON.stringify(longer)).steps.length,20);
});
check('known route catalogue and recommendation ordering remain identical to WEB38 source',()=>{
 const before=fs.readFileSync('outputs/night-20260905/personal-route-before-web39.tsx','utf8');const current=fs.readFileSync('src/components/sections/PersonalRouteFinder.tsx','utf8');
 const extract=(source,start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
 for(const [start,end] of [['const tools:','const stagePriority:'],['const stagePriority:','export function PersonalRouteFinder']])assert.equal(extract(current,start,end).replaceAll('\r',''),extract(before,start,end).replaceAll('\r',''));
 const hrefs=[...extract(current,'const tools:','const stagePriority:').matchAll(/href: "([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(hrefs,normalize(route.routeToolHrefs));
});
check('reading aliases deduplicate independently of order and exclude future from current week',()=>{
 const now=new Date('2026-09-05T00:00:00Z');const records=[{href:'/resources/australia-public-holiday-pay-guide',title:'Old',completedAt:'2026-09-01T03:00:00Z'},{href:'/resources/australia-public-holiday-work-pay-guide',title:'Alias',completedAt:'2026-09-02T03:00:00.000Z'},{href:'/resources/future',title:'Future',completedAt:'2099-09-01T00:00:00Z'}];
 const parsed=reading.parseArticleHistory(JSON.stringify(records));assert.equal(parsed.length,2);assert.equal(reading.readingThisWeek(parsed,now),1);assert.deepEqual(normalize(parsed),normalize(reading.parseArticleHistory(JSON.stringify([...records].reverse()))));
 assert.equal(reading.parseArticleHistory(JSON.stringify([{...records[0],completedAt:'2026-02-30T00:00:00Z'}])),null);
});
check('long reading history is preserved on append, events follow successful write only',()=>{
 const records=Array.from({length:70},(_,i)=>({href:`/resources/article-${i}`,title:`Title ${i}`,completedAt:'2026-09-01T00:00:00Z'}));data.set(reading.ARTICLE_READ_HISTORY_KEY,JSON.stringify(records));assert.equal(reading.readArticleHistory().length,70);const result=reading.markArticleAsRead({href:'/resources/new-article',title:'New'});assert.equal(result.status,'saved');assert.equal(JSON.parse(data.get(reading.ARTICLE_READ_HISTORY_KEY)).length,71);assert.equal(JSON.parse(events[0].snapshot[reading.ARTICLE_READ_HISTORY_KEY]).length,71);
});
check('corrupt/partial history and write denial preserve original and dispatch no event',()=>{
 for(const raw of ['{bad',JSON.stringify([{href:'/resources/valid',title:'Good',completedAt:'2026-09-01T00:00:00Z'},null])]){data.set(reading.ARTICLE_READ_HISTORY_KEY,raw);assert.equal(reading.markArticleAsRead({href:'/resources/new',title:'New'}).status,'invalid');assert.equal(data.get(reading.ARTICLE_READ_HISTORY_KEY),raw);}
 data.set(reading.ARTICLE_READ_HISTORY_KEY,'[]');writeFail=true;assert.equal(reading.markArticleAsRead({href:'/resources/new',title:'New'}).status,'failed');assert.equal(data.get(reading.ARTICLE_READ_HISTORY_KEY),'[]');assert.equal(events.length,0);assert.equal(writes.length,0);
});
check('weekly goal invalid/read/write failures preserve raw, success dispatches after persistence',()=>{
 data.set(reading.WEEKLY_READING_GOAL_KEY,'{bad');assert.equal(reading.saveWeeklyReadingGoal(1).status,'invalid');assert.equal(data.get(reading.WEEKLY_READING_GOAL_KEY),'{bad');writeFail=true;assert.equal(reading.saveWeeklyReadingGoal(1,true).status,'failed');assert.equal(events.length,0);writeFail=false;assert.equal(reading.saveWeeklyReadingGoal(1,true).status,'saved');assert.equal(JSON.parse(events[0].snapshot[reading.WEEKLY_READING_GOAL_KEY]).target,1);
});
check('bookmark 30-to-31 is refused without deleting; remove one then add succeeds',()=>{
 const records=Array.from({length:30},(_,i)=>({href:`/resources/article-${i}`,title:`Title ${i}`,savedAt:'2026-09-01T00:00:00Z'}));const raw=JSON.stringify(records);data.set(bookmarks.bookmarkKey,raw);assert.equal(bookmarks.toggleSavedPage('/resources/new','New').status,'full');assert.equal(data.get(bookmarks.bookmarkKey),raw);assert.equal(events.length,0);assert.equal(bookmarks.toggleSavedPage(records[0].href,'Title 0').status,'saved');assert.equal(bookmarks.toggleSavedPage('/resources/new','New').status,'saved');assert.equal(JSON.parse(data.get(bookmarks.bookmarkKey)).length,30);
});
check('legacy long bookmarks and aliases retained, whole unsafe-link import blocked',()=>{
 const records=Array.from({length:45},(_,i)=>({href:`/resources/article-${i}`,title:'Title '.repeat(100),savedAt:'2026-09-01T00:00:00Z'}));assert.equal(bookmarks.parseBookmarks(JSON.stringify(records)).length,45);data.set(bookmarks.bookmarkKey,JSON.stringify(records));bookmarks.toggleSavedPage(records[0].href,'Title');assert.equal(JSON.parse(data.get(bookmarks.bookmarkKey)).length,44);
 for(const href of ['//evil.test','javascript:alert(1)','/\\evil.test'])assert.equal(bookmarks.parseBookmarks(JSON.stringify([{...records[0],href}])),null);
 const legacy={...records[0],href:'/resources/australia-public-holiday-pay-guide'},canonical={...legacy,href:'/resources/australia-public-holiday-work-pay-guide'};assert.equal(bookmarks.parseBookmarks(JSON.stringify([legacy,canonical])).length,1);
});
check('seven-day calendar has exact date, end, stamp, folded CRLF lines and current snapshot',()=>{
 const result=route.personalPlanCalendar(plan(),new Date('2026-09-05T03:00:00Z'));assert.equal(result.date,'2026-09-12');assert(result.contents.includes('DTSTART;VALUE=DATE:20260912'));assert(result.contents.includes('DTEND;VALUE=DATE:20260913'));assert(result.contents.includes('DTSTAMP:20260905T030000Z'));assert(result.contents.includes('URL:https://hojucompass.com/?plan=saved#route-finder'));for(const line of result.contents.split('\r\n'))assert(Buffer.byteLength(line)<=75);
});
console.log(`${count} Compass/reading/plan checks passed.`);
