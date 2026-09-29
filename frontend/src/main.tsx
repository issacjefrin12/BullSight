import React,{useEffect,useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import axios from "axios";
import {
 Activity, BarChart3, Bell, BrainCircuit, CandlestickChart, CheckCircle2, Clock3,
 Database, Download, History, LayoutDashboard, LineChart as LineIcon, RefreshCw,
 Search, Settings, ShieldCheck, Sparkles, Star, Trash2, TrendingDown, TrendingUp,
 WalletCards, Zap
} from "lucide-react";
import {
 AreaChart,Area,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid,
 BarChart,Bar,LineChart,Line,ReferenceLine
} from "recharts";
import "./styles.css";

const API="http://127.0.0.1:8000/api";
const SYMBOLS=["RELIANCE.NS","TCS.NS","INFY.NS","HDFCBANK.NS","ICICIBANK.NS","SBIN.NS","ITC.NS","LT.NS","^NSEI","^BSESN"];
const money=(n:number)=>"₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2});
const displaySymbol=(s:string)=>s==="^NSEI"?"NIFTY 50":s==="^BSESN"?"SENSEX":s.replace(".NS","");
type Row={date:string,open:number,high:number,low:number,close:number,volume:number,sma20:number,sma50:number,ema20:number,rsi:number,macd:number,macd_signal:number,bb_upper:number,bb_lower:number,return:number,volatility:number};
type Source={symbol:string,source:string,provider:string,status:string,rows:number,latest_market_date:string|null,downloaded_at:string|null,cache_fresh:boolean,error?:string|null};
type Metric={model:string,mae:number,rmse:number,mape:number,r2:number,status:string,device?:string,error?:string};
type Pred={symbol:string,prediction_date:string,current_price:number,predicted_price:number,predicted_change_pct:number,signal:string,best_model:string,metrics:Metric[],data_source:Source,evaluation_curve:{date:string,actual:number,predicted:number}[],feature_count:number,features:string[],history_saved?:boolean,explanation:{RSI:number,MACD:number,MACD_Signal:number,rule:string,trend:string,volume:string}};
type Market={name:string,symbol:string,value:number,change_pct:number,source:Source};

function App(){
 const [symbol,setSymbol]=useState("RELIANCE.NS"),[rows,setRows]=useState<Row[]>([]),[pred,setPred]=useState<Pred|null>(null);
 const [tab,setTab]=useState("Overview"),[q,setQ]=useState(""),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const [refreshing,setRefreshing]=useState(false),[source,setSource]=useState<Source|null>(null),[watch,setWatch]=useState<string[]>(()=>JSON.parse(localStorage.getItem("bullsight_watchlist")||"[]"));
 const [market,setMarket]=useState<Market[]>([]),[history,setHistory]=useState<any[]>([]);
 const normalizedQuery=(value:string)=>{
   const v=value.trim().toUpperCase();
   if(!v) return "";
   const aliases:Record<string,string>={"NIFTY":"^NSEI","NIFTY50":"^NSEI","NIFTY 50":"^NSEI","SENSEX":"^BSESN"};
   if(aliases[v]) return aliases[v];
   return v.startsWith("^") || v.includes(".") ? v : `${v}.NS`;
 };
 const filtered=SYMBOLS.filter(s=>s.toLowerCase().includes(q.toLowerCase())).slice(0,6);
 const searchStock=()=>{
   const next=normalizedQuery(q);
   if(!next) return;
   setSymbol(next);
   setQ("");
   setTab("Overview");
 };
 const latest=rows.at(-1), first=rows[0];
 const chartData=useMemo(()=>rows.map(r=>({...r,label:r.date.slice(5)})),[rows]);
 const change=latest&&first?((latest.close-first.close)/first.close)*100:0;
 const load=async(s=symbol)=>{
   setLoading(true);setError("");
   try{
     // Load the stock first so a stale/missing cache is refreshed once before
     // the prediction endpoint trains on the same verified dataset.
     const a=await axios.get(`${API}/stock/${encodeURIComponent(s)}`);
     setRows(a.data.data);setSource(a.data.source||null);
     const b=await axios.get(`${API}/predict/${encodeURIComponent(s)}`);
     setPred(b.data);setSource(a.data.source||b.data.data_source);
   }catch(e:any){setError(e?.response?.data?.detail||e?.message||"Backend connection failed. Start FastAPI on port 8000.");}
   finally{setLoading(false);}
 };
 const loadMarket=async()=>{try{const r=await axios.get(`${API}/market-overview`);setMarket(r.data.items||[])}catch{}};
 const loadHistory=async()=>{try{const r=await axios.get(`${API}/history?limit=50`);setHistory(r.data.items||[])}catch{}};
 useEffect(()=>{load(symbol);loadMarket();loadHistory()},[symbol]);
 useEffect(()=>localStorage.setItem("bullsight_watchlist",JSON.stringify(watch)),[watch]);
 const refresh=async()=>{
   setRefreshing(true);setError("");
   try{await axios.post(`${API}/refresh/${encodeURIComponent(symbol)}`);await load(symbol);await loadMarket();await loadHistory();}
   catch(e:any){setError(e?.response?.data?.detail||e?.message||"Yahoo Finance refresh failed.")}
   finally{setRefreshing(false);}
 };
 const toggleWatch=()=>setWatch(w=>w.includes(symbol)?w.filter(x=>x!==symbol):[...w,symbol]);
 const nav=[
   ["Overview",<LayoutDashboard/>],["Predictions",<BrainCircuit/>],["Analytics",<BarChart3/>],
   ["Watchlist",<Star/>],["Prediction History",<History/>],["Data Pipeline",<Database/>],
   ["Model Health",<ShieldCheck/>],["Settings",<Settings/>]
 ] as const;
 return <div className="app">
   <aside>
    <div className="brand"><img src="/bullsight-logo.png" alt="Bull Sight"/><div><b>BULL SIGHT</b><small>AI MARKET INTELLIGENCE</small></div></div>
    <label>WORKSPACE</label>
    {nav.slice(0,5).map(([x,icon])=><button key={x} className={tab===x?"nav active":"nav"} onClick={()=>setTab(x)}>{icon}{x}</button>)}
    <label>SYSTEM</label>
    {nav.slice(5,7).map(([x,icon])=><button key={x} className={tab===x?"nav active":"nav"} onClick={()=>setTab(x)}>{icon}{x}</button>)}
    <div className="push"><button className={tab==="Settings"?"nav active":"nav"} onClick={()=>setTab("Settings")}><Settings/>Settings</button><small className="online">● Local prediction engine online</small></div>
   </aside>
   <main>
    <header>
      <div><small className="eyebrow">MARKET INTELLIGENCE / LIVE WORKSPACE</small><h1>{tab}</h1><p>Predict tomorrow's market, today.</p></div>
      <div className="headicons"><button title="Refresh Yahoo Finance" onClick={refresh}><RefreshCw className={refreshing?"spin":""}/></button><button><Bell/></button><i>BS</i></div>
    </header>
    <div className="searchrow">
      <div className="search">
        <Search/>
        <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==="Enter") searchStock()}} placeholder="Search NSE ticker (e.g. TCS or TCS.NS)..."/>
        <kbd>Enter</kbd>
        <button className="searchGo" onClick={searchStock} title="Search ticker"><Search/></button>
      </div>
      <div className="chips">{filtered.map(s=><button key={s} className={s===symbol?"chip sel":"chip"} onClick={()=>{setSymbol(s);setTab("Overview")}}>{displaySymbol(s)}</button>)}{q.trim()&&!filtered.some(s=>s.toLowerCase()===normalizedQuery(q).toLowerCase())&&<button className="chip custom" onClick={searchStock}>Search {normalizedQuery(q).replace(".NS","")}</button>}</div>
    </div>
    {error&&<div className="error"><b>Data engine:</b> {error}<button onClick={refresh}>Retry Yahoo refresh</button></div>}
    {loading?<div className="loading"><Zap/><b>Running the prediction engine…</b><span>Yahoo Finance → features → four models → evaluation</span></div>:
      <>{tab==="Overview"&&<Overview rows={rows} chartData={chartData} latest={latest} first={first} change={change} pred={pred} watch={watch} toggleWatch={toggleWatch} market={market}/>}
      {tab==="Predictions"&&<Predictions pred={pred}/>}
      {tab==="Analytics"&&<Analytics rows={rows} chartData={chartData} pred={pred}/>}
      {tab==="Watchlist"&&<Watchlist watch={watch} setSymbol={setSymbol} setTab={setTab} setWatch={setWatch}/>}
      {tab==="Prediction History"&&<HistoryPage items={history}/>}
      {tab==="Data Pipeline"&&<Pipeline rows={rows} source={source} pred={pred}/>}
      {tab==="Model Health"&&<Health pred={pred}/>}
      {tab==="Settings"&&<SettingsPage watch={watch} setWatch={setWatch}/>}</>
    }
   </main>
 </div>
}

function SourceBadge({source}:{source:Source|null}){return <div className="sourceBadge"><span className={source?.status==="verified"?"dot ok":"dot warn"}/><div><b>{source?.status==="verified"?"Yahoo Finance verified":"Cached market data"}</b><small>{source?.provider||"yfinance"} · {source?.latest_market_date||"—"} · {source?.rows||0} rows</small></div></div>}

function Overview({rows,chartData,latest,first,change,pred,watch,toggleWatch,market}:{rows:Row[],chartData:any[],latest?:Row,first?:Row,change:number,pred:Pred|null,watch:string[],toggleWatch:()=>void,market:Market[]}){
 return <div>
  <section className="marketStrip">{market.map(m=><div className="marketMini" key={m.symbol}><span>{m.name}</span><b>{m.value.toLocaleString("en-IN")}</b><em className={m.change_pct>=0?"up":"down"}>{m.change_pct>=0?"↑":"↓"} {Math.abs(m.change_pct).toFixed(2)}%</em></div>)}</section>
  <div className="sourceLine"><SourceBadge source={pred?.data_source||null}/><span>Automatic refresh every 6 hours · Use ↻ for a forced Yahoo Finance refresh.</span></div>
  <section className="grid2">
   <div className="card">
    <div className="top"><div><small>SELECTED ASSET</small><h2>{displaySymbol(pred?.symbol||"")} <em>NSE</em></h2></div><div className="asset"><Activity/></div></div>
    <div className="price">{money(latest?.close||0)} <span className={change>=0?"up":"down"}>{change>=0?"↑":"↓"} {Math.abs(change).toFixed(2)}%</span></div>
    <small className="muted">Historical window · {rows.length} trading sessions · latest {latest?.date}</small>
    <div className="stats">{[["OPEN",latest?.open],["HIGH",latest?.high],["LOW",latest?.low],["VOLUME",(latest?.volume||0)/1e6]].map(([n,v])=><div key={String(n)}><small>{n}</small><b>{n==="VOLUME"?Number(v).toFixed(2)+"M":money(Number(v||0))}</b></div>)}</div>
    <button className="watchBtn" onClick={toggleWatch}>{watch.includes(pred?.symbol||"")?<Star fill="currentColor"/>:<Star/>}{watch.includes(pred?.symbol||"")?"In watchlist":"Add to watchlist"}</button>
   </div>
   <div className="card forecastCard">
    <div className="top"><div><small>AI FORECAST</small><h2>Next Trading Day</h2></div><Sparkles/></div>
    <div className="forecast">{money(pred?.predicted_price||0)}</div><span className={(pred?.predicted_change_pct||0)>=0?"up":"down"}>{(pred?.predicted_change_pct||0)>=0?"↑":"↓"} {Math.abs(pred?.predicted_change_pct||0).toFixed(2)}% projected move</span>
    <div className={"signal "+(pred?.signal||"HOLD").toLowerCase()}>{pred?.signal==="BUY"?<TrendingUp/>:pred?.signal==="SELL"?<TrendingDown/>:<Activity/>}<b>{pred?.signal}</b><span>Decision-support signal</span></div>
    <div className="model"><span>Selected model</span><b>{pred?.best_model}</b></div>
   </div>
  </section>
  <section className="gridChart">
   <div className="card"><div className="section"><div><small>PRICE ACTION</small><h3>Historical performance</h3></div><span>160D</span></div><div className="chart"><ResponsiveContainer><AreaChart data={chartData}><defs><linearGradient id="priceG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9cf07b" stopOpacity=".3"/><stop offset="100%" stopColor="#9cf07b" stopOpacity="0"/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={.08}/><XAxis dataKey="label" tick={{fontSize:9}}/><YAxis domain={["auto","auto"]} tick={{fontSize:9}}/><Tooltip contentStyle={{background:"#10151d",border:"1px solid #283244",borderRadius:10}}/><Area type="monotone" dataKey="close" stroke="#9cf07b" fill="url(#priceG)" strokeWidth={2.5}/></AreaChart></ResponsiveContainer></div></div>
   <Indicators latest={latest}/>
  </section>
  <section className="gridBottom"><ModelCard pred={pred}/><div className="card"><div className="section"><div><small>EXPLAINABLE AI</small><h3>Why the signal?</h3></div><Sparkles/></div><p>RSI is <b>{pred?.explanation.RSI}</b>. MACD is <b>{pred?.explanation.MACD}</b> versus signal <b>{pred?.explanation.MACD_Signal}</b>.</p><div className="insightList"><span>Trend: <b>{pred?.explanation.trend}</b></span><span>Volume: <b>{pred?.explanation.volume}</b></span></div><div className="rule"><Zap/> {pred?.explanation.rule}</div><small className="disclaimer">Academic decision-support only. Predictions are statistical estimates, not guaranteed returns.</small></div></section>
 </div>
}
function Indicators({latest}:{latest?:Row}){return <div className="card"><div className="section"><div><small>TECHNICAL PULSE</small><h3>Indicators</h3></div><Activity/></div>{[["RSI",latest?.rsi],["SMA 20",latest?.sma20],["SMA 50",latest?.sma50],["EMA 20",latest?.ema20],["MACD",latest?.macd]].map(([n,v])=><div className="indicator" key={String(n)}><div><b>{n}</b><small>Technical signal</small></div><strong>{n==="RSI"?Number(v||0).toFixed(1):money(Number(v||0))}</strong></div>)}</div>}
function ModelCard({pred}:{pred:Pred|null}){return <div className="card"><div className="section"><div><small>MODEL LAB</small><h3>Four-model comparison</h3></div><BrainCircuit/></div><div className="bar"><ResponsiveContainer><BarChart data={pred?.metrics||[]}><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={.08}/><XAxis dataKey="model" tick={{fontSize:8}}/><YAxis tick={{fontSize:9}}/><Tooltip contentStyle={{background:"#10151d",border:"1px solid #283244"}}/><Bar dataKey="mae" fill="#9cf07b" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div><div className="metrics">{(pred?.metrics||[]).map(m=><div key={m.model}><b>{m.model}</b><small>MAE {m.mae} · RMSE {m.rmse} · MAPE {m.mape}% · R² {m.r2}</small></div>)}</div></div>}

function Predictions({pred}:{pred:Pred|null}){return <div className="pageGrid"><div className="card bigPrediction"><small>MODEL OUTPUT</small><h2>{displaySymbol(pred?.symbol||"")} next-day forecast</h2><div className="bigNumber">{money(pred?.predicted_price||0)}</div><div className={(pred?.predicted_change_pct||0)>=0?"up":"down"}>{(pred?.predicted_change_pct||0)>=0?"↑":"↓"} {Math.abs(pred?.predicted_change_pct||0).toFixed(2)}% projected move</div><div className={"signal "+(pred?.signal||"HOLD").toLowerCase()}><b>{pred?.signal}</b><span>Transparent heuristic signal</span></div><p className="muted">Best model: <b>{pred?.best_model}</b>, selected using the lowest test MAE.</p><SourceBadge source={pred?.data_source||null}/></div><div className="card"><div className="section"><div><small>EVALUATION</small><h3>Model performance</h3></div><CheckCircle2/></div><div className="table">{(pred?.metrics||[]).map(m=><div className="tableRow" key={m.model}><b>{m.model}</b><span>{m.status==="ready"?`MAE ${m.mae}`:"Unavailable"}</span><span>RMSE {m.rmse||"—"}</span><span>MAPE {m.mape||"—"}%</span><span>R² {m.r2||"—"}</span></div>)}</div></div><div className="card full"><div className="section"><div><small>VALIDATION</small><h3>Actual vs predicted — {pred?.best_model}</h3></div><LineIcon/></div><div className="chart validation"><ResponsiveContainer><LineChart data={pred?.evaluation_curve||[]}><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={.08}/><XAxis dataKey="date" tick={{fontSize:8}}/><YAxis domain={["auto","auto"]} tick={{fontSize:9}}/><Tooltip contentStyle={{background:"#10151d",border:"1px solid #283244"}}/><Line dataKey="actual" stroke="#8ba0b8" dot={false} strokeWidth={1.5}/><Line dataKey="predicted" stroke="#9cf07b" dot={false} strokeWidth={2}/></LineChart></ResponsiveContainer></div><div className="legend"><span>● Actual</span><span>● Predicted</span></div></div></div>}

function Analytics({rows,chartData,pred}:{rows:Row[],chartData:any[],pred:Pred|null}){return <div className="analytics">
 <div className="card"><div className="section"><div><small>MOMENTUM</small><h3>RSI · 14 period</h3></div></div><div className="chart smallChart"><ResponsiveContainer><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={.08}/><XAxis dataKey="label" tick={{fontSize:9}}/><YAxis domain={[0,100]} tick={{fontSize:9}}/><ReferenceLine y={70} stroke="#ff7d89" strokeDasharray="4 4"/><ReferenceLine y={30} stroke="#9cf07b" strokeDasharray="4 4"/><Tooltip contentStyle={{background:"#10151d",border:"1px solid #283244"}}/><Line type="monotone" dataKey="rsi" stroke="#9cf07b" dot={false}/></LineChart></ResponsiveContainer></div></div>
 <div className="card"><div className="section"><div><small>MOMENTUM</small><h3>MACD</h3></div></div><div className="chart smallChart"><ResponsiveContainer><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={.08}/><XAxis dataKey="label" tick={{fontSize:9}}/><YAxis tick={{fontSize:9}}/><Tooltip contentStyle={{background:"#10151d",border:"1px solid #283244"}}/><Line dataKey="macd" stroke="#9cf07b" dot={false}/><Line dataKey="macd_signal" stroke="#8ba0b8" dot={false}/></LineChart></ResponsiveContainer></div></div>
 <div className="card full"><div className="section"><div><small>VOLATILITY & PRICE RANGE</small><h3>Daily return / volatility</h3></div><Activity/></div><div className="chart smallChart"><ResponsiveContainer><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={.08}/><XAxis dataKey="label" tick={{fontSize:9}}/><YAxis tick={{fontSize:9}}/><Tooltip contentStyle={{background:"#10151d",border:"1px solid #283244"}}/><Line dataKey="return" stroke="#9cf07b" dot={false}/><Line dataKey="volatility" stroke="#d2a6ff" dot={false}/></LineChart></ResponsiveContainer></div></div>
 <div className="card full"><div className="section"><div><small>TRADING ACTIVITY</small><h3>Volume</h3></div></div><div className="chart smallChart"><ResponsiveContainer><BarChart data={rows}><XAxis dataKey="date" tick={{fontSize:8}}/><YAxis tick={{fontSize:9}}/><Tooltip contentStyle={{background:"#10151d",border:"1px solid #283244"}}/><Bar dataKey="volume" fill="#4069a8"/></BarChart></ResponsiveContainer></div></div>
 <div className="card full"><div className="section"><div><small>FEATURE ENGINEERING</small><h3>Model inputs</h3></div><Database/></div><div className="featureGrid">{(pred?.features||[]).map(f=><span key={f}>{f}</span>)}</div></div>
 </div>}

function Watchlist({watch,setSymbol,setTab,setWatch}:{watch:string[],setSymbol:(s:string)=>void,setTab:(s:string)=>void,setWatch:React.Dispatch<React.SetStateAction<string[]>>}){return <div className="card listCard"><div className="section"><div><small>PERSONAL WORKSPACE</small><h3>Your watchlist</h3></div><Star/></div>{watch.length===0?<div className="empty"><Star/><b>No stocks saved yet</b><span>Add a stock from Overview.</span></div>:watch.map(s=><div className="watchRow" key={s}><div><b>{displaySymbol(s)}</b><small>NSE · tracked asset</small></div><button onClick={()=>{setSymbol(s);setTab("Overview")}}>Open</button><button className="trash" onClick={()=>setWatch(w=>w.filter(x=>x!==s))}><Trash2/></button></div>)}</div>}

function HistoryPage({items}:{items:any[]}){return <div className="card listCard"><div className="section"><div><small>MODEL MEMORY</small><h3>Prediction history</h3></div><History/></div>{items.length===0?<div className="empty"><History/><b>No predictions recorded</b><span>Run a stock prediction to create the first record.</span></div>:<div className="table historyTable">{items.map((x:any)=><div className="tableRow historyRow" key={x.id}><b>{x.symbol.replace(".NS","")}</b><span>{x.prediction_date}</span><span>{money(x.current_price)}</span><span>{money(x.predicted_price)}</span><span className={x.signal==="BUY"?"up":x.signal==="SELL"?"down":""}>{x.signal}</span><span>{x.best_model}</span></div>)}</div>}</div>}

function Pipeline({rows,source,pred}:{rows:Row[],source:Source|null,pred:Pred|null}){const steps=[["Data collection","Yahoo Finance / yfinance historical OHLCV","READY"],["Preprocessing","Date ordering, numeric validation, duplicates and missing values","READY"],["Feature engineering","SMA, EMA, RSI, MACD, Bollinger, returns and volatility","READY"],["Model training","Linear Regression, Random Forest, XGBoost and LSTM","READY"],["Evaluation","MAE, RMSE, MAPE and R² on time-aware test data","READY"],["Prediction","Next trading-day close + analytical signal","READY"]];return <div className="card pipeline"><div className="section"><div><small>DATA ENGINE</small><h3>End-to-end pipeline</h3></div><Database/></div><SourceBadge source={source}/>{steps.map(([a,b,c],i)=><div className="pipe" key={a}><div className="step">{i+1}</div><div><b>{a}</b><span>{b}</span></div><strong>{c}</strong></div>)}<div className="sourceNote"><Download/><div><b>Verified dataset</b><span>{source?.rows||rows.length} rows · latest market date {source?.latest_market_date||"—"} · {pred?.feature_count||17} engineered model features</span><small>{source?.downloaded_at?`Last Yahoo download ${new Date(source.downloaded_at).toLocaleString()}`:"No verified download recorded yet."}</small></div></div></div>}

function Health({pred}:{pred:Pred|null}){return <div className="healthGrid"><div className="card healthHero"><ShieldCheck/><small>MODEL ENGINE</small><h2>Operational</h2><p>Four-model evaluation pipeline. Best model is selected from the chronological test set using MAE.</p></div>{(pred?.metrics||[]).map(m=><div className="card health" key={m.model}><div><BrainCircuit/><b>{m.model}</b></div><span>MAE {m.mae}</span><span>RMSE {m.rmse}</span><span>MAPE {m.mape}%</span><span>R² {m.r2}</span><strong>{m.status==="ready"?"READY":"OPTIONAL / INSTALL PYTORCH"}</strong></div>)}</div>}

function SettingsPage({watch,setWatch}:{watch:string[],setWatch:React.Dispatch<React.SetStateAction<string[]>>}){return <div className="card settingsPage"><div className="section"><div><small>APPLICATION</small><h3>Settings & project notes</h3></div><Settings/></div><div className="setting"><div><b>Data source</b><span>Yahoo Finance through yfinance · automatic six-hour cache</span></div><strong>VERIFIED ON REFRESH</strong></div><div className="setting"><div><b>Prediction target</b><span>Next trading day's closing price</span></div><strong>REGRESSION</strong></div><div className="setting"><div><b>Models</b><span>Linear Regression · Random Forest · XGBoost · LSTM</span></div><strong>4-MODEL</strong></div><div className="setting"><div><b>Watchlist</b><span>{watch.length} saved assets in this browser</span></div><button onClick={()=>setWatch([])}>Clear</button></div><div className="setting"><div><b>Future research</b><span>News sentiment, SHAP/LIME, walk-forward validation, alerts and Transformer/GRU extensions</span></div><strong>ROADMAP</strong></div><div className="disclaimer">Bull Sight is an academic decision-support project. It does not provide financial advice or guarantee market outcomes.</div></div>}

createRoot(document.getElementById("root")!).render(<App/>);
