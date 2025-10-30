(()=>{var e={};e.id=15,e.ids=[15],e.modules={2849:e=>{function t(e){var t=Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}t.keys=()=>[],t.resolve=t,t.id=2849,e.exports=t},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{"use strict";e.exports=require("buffer")},4770:e=>{"use strict";e.exports=require("crypto")},7702:e=>{"use strict";e.exports=require("events")},8216:e=>{"use strict";e.exports=require("net")},5816:e=>{"use strict";e.exports=require("process")},6162:e=>{"use strict";e.exports=require("stream")},4026:e=>{"use strict";e.exports=require("string_decoder")},5346:e=>{"use strict";e.exports=require("timers")},2452:e=>{"use strict";e.exports=require("tls")},7360:e=>{"use strict";e.exports=require("url")},1764:e=>{"use strict";e.exports=require("util")},1568:e=>{"use strict";e.exports=require("zlib")},7651:(e,t,r)=>{"use strict";r.r(t),r.d(t,{originalPathname:()=>f,patchFetch:()=>E,requestAsyncStorage:()=>p,routeModule:()=>m,serverHooks:()=>y,staticGenerationAsyncStorage:()=>g});var i={};r.r(i),r.d(i,{GET:()=>c});var n=r(9303),a=r(8716),u=r(670),d=r(7070),l=r(2198),s=r(1402),_=r(1970);let o=new Set(["human_activity","animal_in_vivo","in_vitro","chemicals"]);async function c(e,t){try{let r=t.params.drug_id;if(!r)return(0,s.Bp)("missing path parameter drug_id",["drug_id"]);let i=new URL(e.url),n=i.searchParams.get("expand"),a=n?(0,_.t1)(n):void 0;if(a){for(let e of a)if(!o.has(e))return(0,s.Bp)("expand option "+e+" is not supported",["expand"])}let u=(0,_.nV)(i.searchParams.get("all_entities"),!1),c=await (0,l.I3)(r,{expand:a,allEntities:u});if(!c)return(0,s.v6)("drug "+r+" not found");return a&&!a.has("human_activity")&&(c.human_activity=[]),a&&!a.has("animal_in_vivo")&&(c.animal_in_vivo={studies:[]}),a&&!a.has("in_vitro")&&(c.in_vitro={}),d.NextResponse.json(c)}catch(t){let e=t instanceof Error?t.message:"Internal server error";return(0,s.I3)(e)}}let m=new n.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/rdc/[drug_id]/route",pathname:"/api/rdc/[drug_id]",filename:"route",bundlePath:"app/api/rdc/[drug_id]/route"},resolvedPagePath:"E:\\project\\drug\\rdc-api\\app\\api\\rdc\\[drug_id]\\route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:p,staticGenerationAsyncStorage:g,serverHooks:y}=m,f="/api/rdc/[drug_id]/route";function E(){return(0,u.patchFetch)({serverHooks:y,staticGenerationAsyncStorage:g})}},1402:(e,t,r)=>{"use strict";r.d(t,{Bp:()=>a,I3:()=>d,v6:()=>u});var i=r(7070);function n({code:e,message:t,status:r,details:n=[]}){return i.NextResponse.json({error:{code:e,message:t,details:n}},{status:r})}function a(e,t=[]){return n({code:"VALIDATION_ERROR",message:e,status:422,details:t})}function u(e){return n({code:"NOT_FOUND",message:e,status:404})}function d(e){return n({code:"SERVER_ERROR",message:e,status:500})}},1970:(e,t,r)=>{"use strict";function i(e,t,{min:r,max:i}={}){if(null===e||""===e.trim())return t;let n=Number.parseInt(e,10);return Number.isNaN(n)?t:"number"==typeof r&&n<r?r:"number"==typeof i&&n>i?i:n}function n(e,t){if(null===e||""===e.trim())return t;let r=e.trim().toLowerCase();return!!["true","1","yes","y"].includes(r)||!["false","0","no","n"].includes(r)&&t}function a(e){return e?new Set(e.split(",").map(e=>e.trim()).filter(Boolean)):new Set}r.d(t,{LN:()=>i,nV:()=>n,t1:()=>a})},2198:(e,t,r)=>{"use strict";r.d(t,{Bf:()=>m,I3:()=>p,fV:()=>c,b_:()=>o,I9:()=>s,cN:()=>_});var i=r(3785);let n=null;function a(){return n||(n=function(){let e={host:process.env.DB_HOST??"127.0.0.1",port:process.env.DB_PORT?Number(process.env.DB_PORT):3306,user:process.env.DB_USER??"root",password:process.env.DB_PASS??"",database:process.env.DB_NAME??"rdcdb",waitForConnections:!0,connectionLimit:10,namedPlaceholders:!0};return i.createPool(e)}()),n}let u=["compound","ligand","linker","chelator","radionuclide"];function d(e){if(null==e)return null;let t=Number(e);return Number.isNaN(t)?null:t}function l(e){if(null==e)return null;if(e instanceof Date)return e.toISOString();let t=new Date(String(e));return Number.isNaN(t.getTime())?null:t.toISOString()}async function s(){let e=a(),[t]=await e.query("SELECT DISTINCT status FROM rdc_drug WHERE status IS NOT NULL AND status <> '' ORDER BY status");return t.map(e=>e.status).filter(e=>"string"==typeof e&&e.trim().length>0).map(e=>({value:e,label:e}))}async function _({q:e,limit:t=20}){let r=a(),i=`%${e.trim()}%`,[n]=await r.query(`SELECT drug_id, drug_name, status FROM rdc_drug
     WHERE drug_name LIKE ?
     ORDER BY drug_name ASC
     LIMIT ?`,[i,Math.min(Math.max(t,1),100)]);return n.map(e=>({drug_id:e.drug_id,drug_name:e.drug_name,status:e.status??null}))}async function o(e){let t=a(),{page:r,pageSize:i,q:n,status:u,sort:d}=e,s=[],_=[];n&&n.trim()&&(s.push("d.drug_name LIKE ?"),_.push(`%${n.trim()}%`)),u&&u.trim()&&(s.push("d.status = ?"),_.push(u.trim()));let o=s.length?`WHERE ${s.join(" AND ")}`:"",c=function(e){switch(e){case"drug_name:asc":return"d.drug_name ASC";case"drug_name:desc":return"d.drug_name DESC";case"created_at:asc":return"d.created_at ASC";default:return"d.created_at DESC"}}(d),m=Math.max(r,1),p=Math.min(Math.max(i,1),100),[g]=await t.query(`SELECT
       d.drug_id,
       d.drug_name,
       d.status,
       d.type,
       MAX(CASE WHEN dcr.relation_role = 'compound' THEN ce.name END) AS cold_compound_name,
       MAX(CASE WHEN dcr.relation_role = 'ligand' THEN ce.name END) AS ligand_name,
       MAX(CASE WHEN dcr.relation_role = 'linker' THEN ce.name END) AS linker_name,
       MAX(CASE WHEN dcr.relation_role = 'chelator' THEN ce.name END) AS chelator_name,
       MAX(CASE WHEN dcr.relation_role = 'radionuclide' THEN ce.name END) AS radionuclide_name,
       d.created_at
     FROM rdc_drug d
     LEFT JOIN drug_chemical_rel dcr ON d.drug_id = dcr.drug_id
     LEFT JOIN chemical_entity ce ON ce.entity_id = dcr.chemical_entity_id
     ${o}
     GROUP BY d.drug_id, d.drug_name, d.status, d.type, d.created_at
     ORDER BY ${c}
     LIMIT ? OFFSET ?`,[..._,p,(m-1)*p]),[y]=await t.query(`SELECT COUNT(*) AS total FROM rdc_drug d ${o}`,_),f=Number(y[0]?.total??0);return{items:g.map(e=>({drug_id:e.drug_id,drug_name:e.drug_name,status:e.status??null,type:e.type??null,cold_compound_name:e.cold_compound_name??null,ligand_name:e.ligand_name??null,linker_name:e.linker_name??null,chelator_name:e.chelator_name??null,radionuclide_name:e.radionuclide_name??null,created_at:l(e.created_at)})),page:m,page_size:p,total:f}}async function c({status:e,limit:t=50}){let r=a(),[i]=await r.query(`SELECT drug_id, drug_name, status
     FROM rdc_drug
     WHERE status = ?
     ORDER BY drug_name ASC
     LIMIT ?`,[e.trim(),Math.min(Math.max(t,1),200)]);return i.map(e=>({drug_id:e.drug_id,drug_name:e.drug_name,status:e.status??null}))}async function m(e){let t=a(),[r]=await t.query(`SELECT
       drug_id,
       external_id,
       drug_name,
       drug_synonyms,
       status,
       type,
       smiles,
       structure_image,
       chebi_id,
       pubchem_cid,
       pubchem_sid,
       updated_at
     FROM rdc_drug
     WHERE drug_name = ?
     LIMIT 1`,[e.trim()]);if(0===r.length)return;let i=r[0];return{drug_id:i.drug_id,external_id:i.external_id??null,drug_name:i.drug_name,drug_synonyms:i.drug_synonyms??null,status:i.status??null,type:i.type??null,smiles:i.smiles??null,structure_image:i.structure_image??null,chebi_id:i.chebi_id??null,pubchem_cid:i.pubchem_cid??null,pubchem_sid:i.pubchem_sid??null,updated_at:l(i.updated_at)}}async function p(e,t={}){let r=a(),[i]=await r.query(`SELECT
       drug_id,
       external_id,
       drug_name,
       drug_synonyms,
       status,
       type,
       smiles,
       structure_image,
       chebi_id,
       pubchem_cid,
       pubchem_sid,
       created_at,
       updated_at
     FROM rdc_drug
     WHERE drug_id = ?
     LIMIT 1`,[e]);if(0===i.length)return;let n=i[0],u=t.expand??new Set,d=t.allEntities??!1,s={general:{drug_id:n.drug_id,external_id:n.external_id??null,drug_name:n.drug_name,drug_synonyms:n.drug_synonyms??null,status:n.status??null,type:n.type??null,smiles:n.smiles??null,structure_image:n.structure_image??null,chebi_id:n.chebi_id??null,pubchem_cid:n.pubchem_cid??null,pubchem_sid:n.pubchem_sid??null,created_at:l(n.created_at),updated_at:l(n.updated_at)}};return s.chemicals=await g(e,d),u.has("human_activity")&&(s.human_activity=await y(e)),u.has("animal_in_vivo")&&(s.animal_in_vivo=await f(e)),u.has("in_vitro")&&(s.in_vitro=await R(e)),s}async function g(e,t){let r=a(),[i]=await r.query(`SELECT dcr.relation_role, dcr.chemical_entity_id, ce.name
     FROM drug_chemical_rel dcr
     JOIN chemical_entity ce ON ce.entity_id = dcr.chemical_entity_id
     WHERE dcr.drug_id = ?
     ORDER BY dcr.relation_role, ce.name`,[e]),n={compound:null,ligand:null,linker:null,chelator:null,radionuclide:null},d={compound:[],ligand:[],linker:[],chelator:[],radionuclide:[]};for(let e of i){let t=String(e.relation_role??"").toLowerCase();u.includes(t)&&(n[t]||(n[t]=e.name??null),d[t].push({entity_id:e.chemical_entity_id,name:e.name??"",relation_role:e.relation_role}))}let l={compound_name:n.compound,ligand_name:n.ligand,linker_name:n.linker,chelator_name:n.chelator,radionuclide_name:n.radionuclide};return t&&(l.entities=d),l}async function y(e){let t=a(),[r]=await t.query(`SELECT clinical_trial_number, indication, patients, dosage, frequency,
            results_description, purpose, clinical_endpoint, endpoint_period,
            efficacy_description, adverse_events_summary, security_indicators
     FROM human_activity
     WHERE drug_id = ?
     ORDER BY created_at ASC, id ASC`,[e]);return r.map(e=>({clinical_trial_number:e.clinical_trial_number??null,indication:e.indication??null,patients:e.patients??null,dosage:e.dosage??null,frequency:e.frequency??null,results_description:e.results_description??null,purpose:e.purpose??null,clinical_endpoint:e.clinical_endpoint??null,endpoint_period:e.endpoint_period??null,efficacy_description:e.efficacy_description??null,adverse_events_summary:e.adverse_events_summary??null,security_indicators:e.security_indicators??null}))}async function f(e){let t=a(),[r]=await t.query(`SELECT study_id, pmid, doi
     FROM animal_in_vivo_study
     WHERE drug_id = ?
     ORDER BY created_at ASC, id ASC`,[e]);if(0===r.length)return{studies:[]};let i=r.map(e=>e.study_id),n=i.map(()=>"?").join(","),[u]=await t.query(`SELECT * FROM animal_in_vivo_pk WHERE study_ref_id IN (${n}) ORDER BY id ASC`,i),[d]=await t.query(`SELECT * FROM animal_in_vivo_biodist WHERE study_ref_id IN (${n}) ORDER BY id ASC`,i),[l]=await t.query(`SELECT * FROM animal_in_vivo_efficacy WHERE study_ref_id IN (${n}) ORDER BY id ASC`,i),s=b(u,e=>e.study_ref_id),_=b(d,e=>e.study_ref_id),o=b(l,e=>e.study_ref_id);return{studies:r.map(e=>{let t=e.study_id;return{study_id:t,pmid:e.pmid??null,doi:e.doi??null,pk:(s.get(t)??[]).map(E),biodistribution:(_.get(t)??[]).map(h),efficacy:(o.get(t)??[]).map(v)}})}}function E(e){return{pk_animal_model:e.pk_animal_model??null,pk_dosage_symbols:e.pk_dosage_symbols??null,pk_dosage_value:d(e.pk_dosage_value),pk_dosage_unit:e.pk_dosage_unit??null,pk_description:e.pk_description??null,half_life:e.half_life??null,pk_image:e.pk_image??null}}function h(e){return{biodist_type:e.biodist_type??null,animal_model:e.animal_model??null,dosage_symbols:e.dosage_symbols??null,dosage_value:d(e.dosage_value),dosage_unit:e.dosage_unit??null,metabolism:e.metabolism??null,excretion:e.excretion??null,detection_time:e.detection_time??null,tumor_retention_time:e.tumor_retention_time??null,tbr:{tumor_blood:d(e.tbr_tumor_blood),tumor_muscle:d(e.tbr_tumor_muscle),tumor_kidney:d(e.tbr_tumor_kidney),tumor_salivary_glands:d(e.tbr_tumor_salivary_glands),tumor_liver:d(e.tbr_tumor_liver),tumor_lung:d(e.tbr_tumor_lung),tumor_heart:d(e.tbr_tumor_heart)},biodist_result_image:e.biodist_result_image??null,biodist_description:e.biodist_description??null}}function v(e){return{efficacy_animal_model:e.efficacy_animal_model??null,efficacy_dosage_symbols:e.efficacy_dosage_symbols??null,efficacy_dosage_value:d(e.efficacy_dosage_value),efficacy_dosage_unit:e.efficacy_dosage_unit??null,efficacy_description:e.efficacy_description??null,adverse_reactions:e.adverse_reactions??null}}async function R(e){let t=a(),[r]=await t.query(`SELECT in_vitro_id, study_overview, notes
     FROM in_vitro
     WHERE drug_id = ?
     ORDER BY created_at ASC, id ASC`,[e]);if(0===r.length)return{studies:[]};let i=r.map(e=>e.in_vitro_id),n=i.map(()=>"?").join(","),[u]=await t.query(`SELECT * FROM in_vitro_measurement WHERE in_vitro_ref_id IN (${n}) ORDER BY id ASC`,i),l=new Map;for(let e of u){let t=e.measurement_category??"other";l.has(t)||l.set(t,[]),l.get(t).push({measurement_type:e.measurement_type??null,measurement_symbols:e.measurement_symbols??null,measurement_value:d(e.measurement_value),measurement_unit:e.measurement_unit??null,method_description:e.method_description??null})}return{studies:r.map(e=>({in_vitro_id:e.in_vitro_id,study_overview:e.study_overview??null,notes:e.notes??null})),...Object.fromEntries(l.entries())}}function b(e,t){let r=new Map;for(let i of e){let e=t(i);r.has(e)||r.set(e,[]),r.get(e).push(i)}return r}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),i=t.X(0,[276,972,785],()=>r(7651));module.exports=i})();