
import { useState, useEffect } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import './App.css'
import { supabase } from './supabase'
import Login from './login'



type ApiStock = {
  nseCode?: string
  ric?: string
  displayName?: string
  price?: string | number
  percentChange?: string | number
  date?: string
  time?: string
}

type DashboardStock = {
  name: string
  company: string
  price: string
  priceValue: number
  change: string
  changeValue: number
  positive: boolean
  date?: string
  time?: string
}

type PaperHolding = {
  symbol: string
  quantity: number
  price: number
}

const indices = [
  { name: 'NIFTY 50', value: '24,850.50', change: '+1.25%', positive: true },
  { name: 'SENSEX', value: '81,450.20', change: '+0.85%', positive: true },
  { name: 'BANK NIFTY', value: '56,120.75', change: '-0.35%', positive: false },
  { name: 'FINNIFTY', value: '23,650.80', change: '+0.65%', positive: true },
]

const commodities = [
  { name: 'Gold', price: '₹72,500', change: '+0.65%', positive: true },
  { name: 'Silver', price: '₹85,200', change: '+0.45%', positive: true },
  { name: 'Crude Oil', price: '₹6,450', change: '-0.25%', positive: false },
  { name: 'Natural Gas', price: '₹215.40', change: '+0.32%', positive: true },
]

function formatPrice(price: number) {
  return `₹${price.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatChange(change: number) {
  return `${change > 0 ? '+' : ''}${change.toFixed(2)}%`
}

function App() {


  // SUPABASE LOGIN STATUS

  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])




  // BACKEND STATUS

  const [backendStatus, setBackendStatus] = useState('Checking...')

  // API STOCK STATE

  const [liveStocks, setLiveStocks] = useState<ApiStock[]>([])
  const [stockLoading, setStockLoading] = useState(true)
  const [stockError, setStockError] = useState('')

  // SEARCH AND ANALYZER

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStock, setSelectedStock] =
    useState<DashboardStock | null>(null)

  // PAPER TRADING

  const [paperBalance, setPaperBalance] = useState(100000)
  const [paperStock, setPaperStock] = useState('')
  const [paperQuantity, setPaperQuantity] = useState('')
  const [paperPrice, setPaperPrice] = useState('')
  const [paperHoldings, setPaperHoldings] =
    useState<PaperHolding[]>([])

  // BACKEND HEALTH CHECK

  useEffect(() => {
    let cancelled = false

    fetch('https://bharattrade-ai-9oz3.onrender.com/api/health')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Backend connection failed')
        }

        return response.json()
      })
      .then((data) => {
        if (!cancelled) {
          setBackendStatus(data.message || 'Connected')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBackendStatus('Backend not connected')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  // INDIANAPI STOCK DATA

  useEffect(() => {
    let cancelled = false

    const fetchStocks = async () => {
      try {
        const response = await fetch(
          `https://bharattrade-ai-9oz3.onrender.com/api/price-shockers?_=${Date.now()}`
        )

        if (!response.ok) {
          throw new Error('Stock API request failed')
        }

        const result = await response.json()
        console.log('Full API response:', result)

        if (!result.success) {
          throw new Error('Unable to load stock data')
        }

        const nseStocks: ApiStock[] =
          result.data?.NSE_PriceShocker ?? []

        const bseStocks: ApiStock[] =
          result.data?.BSE_PriceShocker ?? []

        const allStocks = [...nseStocks, ...bseStocks]


        if (cancelled) return

        // DEMO: Simulate small price changes

        const demoStocks = allStocks.map((stock) => {
          const originalPrice = Number(stock.price)

          const changePercent = Math.random() * 4 - 2

          const newPrice = originalPrice * (1 + changePercent / 100)

          return {
            ...stock,
            price: Number(newPrice.toFixed(2)),
          }
        })

        setLiveStocks(demoStocks)
        setStockError('')

        console.log('Stock refresh time:', new Date().toLocaleTimeString())

        console.log(
          'Latest DEMO stock records:',
          demoStocks.map((stock) => ({
            name: stock.nseCode || stock.ric,
            date: stock.date,
            time: stock.time,
            price: stock.price,
          }))
        )

      } catch (error) {
        if (!cancelled) {
          setStockError(
            error instanceof Error
              ? error.message
              : 'Unable to load stocks'
          )
        }
      } finally {
        if (!cancelled) {
          setStockLoading(false)
        }
      }
    }

    void fetchStocks()

    const interval = window.setInterval(() => {
      void fetchStocks()
    }, 300000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  // CONVERT API DATA


  const sourceStocks = liveStocks.length > 0 ? liveStocks : [
    {
      nseCode: 'RELIANCE',
      displayName: 'Reliance Industries',
      price: 1450,
      percentChange: 1.25,
    },
    {
      nseCode: 'TCS',
      displayName: 'Tata Consultancy Services',
      price: 3200,
      percentChange: -0.65,
    },
    {
      nseCode: 'INFY',
      displayName: 'Infosys',
      price: 1800,
      percentChange: 2.1,
    },
    {
      nseCode: 'HDFCBANK',
      displayName: 'HDFC Bank',
      price: 1650,
      percentChange: -1.2,
    },
    {
      nseCode: 'ICICIBANK',
      displayName: 'ICICI Bank',
      price: 1250,
      percentChange: 0.85,
    },
  ]

  const apiStocks: DashboardStock[] = sourceStocks.map((stock) => {
    const originalPrice = Number(stock.price ?? 0)
    const originalChange = Number(stock.percentChange ?? 0)

    const price = Number.isFinite(originalPrice) ? originalPrice : 0
    const change = Number.isFinite(originalChange) ? originalChange : 0

    return {
      name: stock.nseCode || stock.ric || 'UNKNOWN',
      company:
        stock.displayName ||
        stock.nseCode ||
        stock.ric ||
        'Unknown Company',
      price: formatPrice(price),
      priceValue: price,
      change: formatChange(change),
      changeValue: change,
      positive: change >= 0,
      date: stock.date,
      time: stock.time,
    }
  })

    // Avoid duplicate stock symbols from NSE and BSE.
    .filter(
      (stock, index, array) =>
        array.findIndex((item) => item.name === stock.name) === index
    )

  // SEARCH FILTER

  const filteredStocks = apiStocks.filter((stock) => {
    const search = searchTerm.trim().toLowerCase()

    return (
      stock.name.toLowerCase().includes(search) ||
      stock.company.toLowerCase().includes(search)
    )
  })

  // TOP GAINERS

  const topGainers = [...apiStocks]
    .filter((stock) => stock.changeValue > 0)
    .sort((a, b) => b.changeValue - a.changeValue)

  // TOP LOSERS

  const topLosers = [...apiStocks]
    .filter((stock) => stock.changeValue < 0)
    .sort((a, b) => a.changeValue - b.changeValue)

  // SELECT FIRST API STOCK FOR ANALYZER

  useEffect(() => {
    if (apiStocks.length === 0) {
      setSelectedStock(null)
      return
    }

    setSelectedStock((current) => {
      if (current) {
        const matchingStock = apiStocks.find(
          (stock) => stock.name === current.name
        )

        if (matchingStock) {
          return matchingStock
        }
      }

      return apiStocks[0]
    })
  }, [liveStocks])


  // SEARCH HANDLER

  const handleSearch = (value: string) => {
    setSearchTerm(value)

    if (value.trim()) {
      document.getElementById('equity')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  // BUY PAPER STOCK

  const handleBuyStock = () => {
    const quantity = Number(paperQuantity)
    const price = Number(paperPrice)
    const cost = quantity * price

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      alert('Please enter a valid quantity and price.')
      return
    }

    if (!paperStock) {
      alert('Please select a stock.')
      return
    }

    if (!Number.isFinite(cost) || cost > paperBalance) {
      alert('Insufficient virtual balance.')
      return
    }

    setPaperBalance((previous) => previous - cost)

    setPaperHoldings((previous) => [
      ...previous,
      {
        symbol: paperStock,
        quantity,
        price,
      },
    ])

    setPaperQuantity('')
    setPaperPrice('')

    alert('Demo stock purchased successfully!')
  }

  // SELL PAPER STOCK

  const handleSellStock = (index: number) => {
    const holding = paperHoldings[index]

    if (!holding) return

    const enteredQuantity = prompt(
      `Enter quantity to sell (maximum ${holding.quantity}):`
    )

    // Cancel should not be converted into zero.
    if (enteredQuantity === null) return

    const sellQuantity = Number(enteredQuantity)

    if (
      !Number.isInteger(sellQuantity) ||
      sellQuantity <= 0 ||
      sellQuantity > holding.quantity
    ) {
      alert('Please enter a valid quantity.')
      return
    }

    const sellAmount = sellQuantity * holding.price

    setPaperBalance((previous) => previous + sellAmount)

    setPaperHoldings((previous) =>
      previous
        .map((item, itemIndex) =>
          itemIndex === index
            ? {
              ...item,
              quantity: item.quantity - sellQuantity,
            }
            : item
        )
        .filter((item) => item.quantity > 0)
    )

    alert('Demo stock sold successfully!')
  }



  // LOGOUT
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      alert(error.message)
    }
  }

  
  if (!isLoggedIn) {
    return <Login />
  }

  return (
    <div className="app-container min-h-screen">
      {/* API LOADING */}

      {stockLoading && (
        <p>Loading Indian market stocks...</p>
      )}

      {/* API ERROR */}

      {stockError && (
        <p className="text-red-500">
          {stockError}
        </p>
      )}

      {/* BACKEND STATUS */}

      <div className="backend-status">
        <span>Backend Status:</span>

        <strong>
          {backendStatus === 'BharatTrade AI API is working'
            ? 'Connected'
            : backendStatus}
        </strong>
      </div>

      {/* API BANNER */}

      <div className="top-demo-banner">
        <span className="banner-dot"></span>

        <strong>INDIANAPI DATA</strong>

        <span>
          Stock data fetched from IndianAPI. Prices may be delayed
          or outdated.
        </span>
      </div>

      {/* NAVIGATION */}

      <header className="top-nav">
        <div className="top-nav-inner">
          <div className="logo">
            BharatTrade <span>AI</span>
          </div>

          <nav className="top-navigation">
            <a href="#dashboard" className="active">▦ Dashboard</a>
            <a href="#equity">▤ Equity Market</a>
            <a href="#analyzer">⌕ Stock Analyzer</a>
            <a href="#news">▣ Market News</a>
            <a href="#signals">↗ Trading Signals</a>
            <a href="#portfolio">◉ Portfolio</a>
            <a href="#paper">▧ Paper Trading</a>
            <a href="#options">⌁ Options</a>
            <a href="#commodities">◇ Commodities</a>
          </nav>
        </div>
      </header>

      {/* MAIN DASHBOARD */}

      <main className="main-content" id="dashboard">
        {/* HEADER */}

        <header className="top-header">
          <div>
            <p className="eyebrow">MARKET OVERVIEW / INDIA</p>
            <h1>Dashboard</h1>
            <p className="subtitle">
              Your Indian financial markets at a glance.
            </p>
          </div>

          <div className="header-actions">

            <button onClick={handleLogout}>
              Logout
            </button>



            <input
              type="search"
              placeholder="Search stocks..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />

            <span className="demo-label">● MARKET DATA</span>
          </div>
        </header>

        {/* MARKET STATUS */}

        <section className="market-status">
          <div>
            <span className="status-dot"></span>
            <strong>Demo Market Overview</strong>
          </div>

          <span>
            Simulated market values · Not live prices
          </span>
        </section>

        {/* MARKET INDICES */}

        <section className="market-section" id="indices">
          <div className="section-heading">
            <div>
              <h2>Market Indices</h2>
              <p>Major Indian market benchmarks</p>
            </div>

            <span className="section-tag">DEMO</span>
          </div>

          <div className="index-grid">
            {indices.map((item) => (
              <div className="market-card" key={item.name}>
                <p>{item.name}</p>
                <h3>{item.value}</h3>

                <span className={item.positive ? 'positive' : 'negative'}>
                  {item.positive ? '↗' : '↘'} {item.change}
                </span>

                <div className="card-decoration"></div>
              </div>
            ))}
          </div>
        </section>

        {/* DASHBOARD CHART AND HIGHLIGHTS */}

        <div className="dashboard-grid">
          {/* MARKET PERFORMANCE CHART */}

          <section className="panel chart-panel">

            <div className="section-heading">
              <div>
                <h2>Stock Daily Performance</h2>
                <p>Daily percentage changes from IndianAPI stock data</p>
              </div>

              <span className="section-tag">API DATA</span>
            </div>

            <div className="chart-summary">
              <h3>Daily Stock Changes</h3>
              <span>Top 10 API stocks</span>
            </div>

            <div className="chart-area">

              {apiStocks.length > 0 ? (

                <ResponsiveContainer width="100%" height={220}>

                  <BarChart
                    data={apiStocks.slice(0, 10)}
                    margin={{
                      top: 10,
                      right: 10,
                      left: 0,
                      bottom: 10,
                    }}
                  >

                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      angle={-25}
                      textAnchor="end"
                      height={55}
                    />

                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => `${value}%`}
                    />

                    <Tooltip
                      formatter={(value) => [`${value}%`, 'Daily Change']}
                    />

                    <Bar
                      dataKey="changeValue"
                      fill="#38bdf8"
                      radius={[4, 4, 0, 0]}
                    />

                  </BarChart>

                </ResponsiveContainer>

              ) : (

                <p>
                  {stockLoading
                    ? 'Loading stock data...'
                    : 'No stock data available for chart.'}
                </p>

              )}

            </div>

          </section>

          {/* MARKET HIGHLIGHTS */}

          <section className="panel">
            <div className="section-heading">
              <div>
                <h2>Market Highlights</h2>
                <p>Today's demo insights</p>
              </div>
            </div>

            <div className="highlight-item">
              <span className="highlight-icon">↗</span>

              <div>
                <strong>Positive Momentum</strong>
                <p>NIFTY showing simulated gains.</p>
              </div>
            </div>

            <div className="highlight-item">
              <span className="highlight-icon purple">◇</span>

              <div>
                <strong>Options Watch</strong>
                <p>Explore sample CE and PE contracts.</p>
              </div>
            </div>

            <div className="highlight-item">
              <span className="highlight-icon orange">◎</span>

              <div>
                <strong>Commodity Watch</strong>
                <p>Gold and silver demo prices available.</p>
              </div>
            </div>
          </section>
        </div>

        {/* TOP GAINERS AND LOSERS */}

        <section className="movers-section">
          <div className="movers-grid">
            {/* TOP GAINERS */}

            <section className="panel mover-panel">
              <div className="section-heading">
                <div>
                  <h2>Top Gainers</h2>
                  <p>Stocks with positive price changes</p>
                </div>

                <span className="section-tag">INDIANAPI</span>
              </div>

              <div className="mover-list">
                {topGainers.length > 0 ? (
                  topGainers.map((stock) => (
                    <div className="mover-row" key={stock.name}>
                      <div className="mover-stock">
                        <strong>{stock.name}</strong>
                        <span>{stock.company}</span>
                      </div>

                      <div className="mover-values">
                        <strong>{stock.price}</strong>
                        <span className="positive">
                          ↗ {stock.change}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No positive movers available.</p>
                )}
              </div>
            </section>

            {/* TOP LOSERS */}

            <section className="panel mover-panel">
              <div className="section-heading">
                <div>
                  <h2>Top Losers</h2>
                  <p>Stocks with negative price changes</p>
                </div>

                <span className="section-tag">INDIANAPI</span>
              </div>

              <div className="mover-list">
                {topLosers.length > 0 ? (
                  topLosers.map((stock) => (
                    <div className="mover-row" key={stock.name}>
                      <div className="mover-stock">
                        <strong>{stock.name}</strong>
                        <span>{stock.company}</span>
                      </div>

                      <div className="mover-values">
                        <strong>{stock.price}</strong>
                        <span className="negative">
                          ↘ {stock.change}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No negative movers available.</p>
                )}
              </div>
            </section>
          </div>
        </section>

        {/* EQUITY MARKET WATCHLIST */}

        <section className="panel table-panel" id="equity">
          <div className="section-heading">
            <div>
              <h2>Equity Market Watchlist</h2>
              <p>
                Stocks fetched from IndianAPI · Prices may be delayed
              </p>
            </div>

            <span className="section-tag">INDIANAPI</span>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>STOCK</th>
                  <th>COMPANY</th>
                  <th>PRICE</th>
                  <th>CHANGE</th>
                </tr>
              </thead>

              <tbody>
                {filteredStocks.length > 0 ? (
                  filteredStocks.map((stock) => (
                    <tr key={stock.name}>
                      <td>
                        <strong>{stock.name}</strong>
                      </td>

                      <td className="company-name">
                        {stock.company}
                      </td>

                      <td>{stock.price}</td>

                      <td className={stock.positive ? 'positive' : 'negative'}>
                        {stock.change}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>
                      {stockLoading
                        ? 'Loading stocks...'
                        : 'No matching stocks found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* OPTIONS TRADING */}

        <section className="market-section" id="options">
          <div className="section-heading">
            <div>
              <h2>Options Trading</h2>
              <p>Sample NIFTY options information</p>
            </div>

            <span className="section-tag">DEMO</span>
          </div>

          <div className="index-grid">
            <div className="market-card option-card">
              <p>CALL OPTION · CE</p>
              <h3>24,900</h3>
              <span className="positive">Sample strike price</span>
            </div>

            <div className="market-card option-card">
              <p>PUT OPTION · PE</p>
              <h3>24,800</h3>
              <span className="negative">Sample strike price</span>
            </div>

            <div className="market-card option-card">
              <p>EXPIRY</p>
              <h3>Thursday</h3>
              <span>Illustrative expiry information</span>
            </div>
          </div>
        </section>

        {/* COMMODITY MARKET */}

        <section className="market-section" id="commodities">
          <div className="section-heading">
            <div>
              <h2>Commodity Market</h2>
              <p>Precious metals and energy</p>
            </div>

            <span className="section-tag">DEMO</span>
          </div>

          <div className="index-grid">
            {commodities.map((item) => (
              <div className="market-card" key={item.name}>
                <p>{item.name}</p>
                <h3>{item.price}</h3>

                <span className={item.positive ? 'positive' : 'negative'}>
                  {item.change}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* STOCK ANALYZER */}

        <section className="market-section" id="analyzer">
          <div className="section-heading">
            <div>
              <h2>Stock Analyzer</h2>
              <p>Explore individual Indian stocks</p>
            </div>

            <span className="section-tag">INDIANAPI</span>
          </div>

          <div className="panel analyzer-panel">
            <label htmlFor="stock-select">Select a stock</label>

            <select
              id="stock-select"
              value={selectedStock?.name ?? ''}
              disabled={apiStocks.length === 0}
              onChange={(e) => {
                const stock = apiStocks.find(
                  (item) => item.name === e.target.value
                );

                setSelectedStock(stock ?? null);
              }}
            >
              {apiStocks.length === 0 ? (
                <option value="">
                  {stockLoading
                    ? 'Loading stocks...'
                    : 'No API stocks available'}
                </option>
              ) : (
                apiStocks.map((stock) => (
                  <option key={stock.name} value={stock.name}>
                    {stock.name} - {stock.company}
                  </option>
                ))
              )}
            </select>

            {selectedStock ? (
              <div className="analyzer-details">
                <p>Selected Company</p>
                <h3>{selectedStock.company}</h3>

                <div className="analyzer-price">
                  <div>
                    <span>Stock Symbol</span>
                    <strong>{selectedStock.name}</strong>
                  </div>

                  <div>
                    <span>API Price</span>
                    <strong>{selectedStock.price}</strong>
                  </div>

                  <div>
                    <span>Daily Change</span>

                    <strong
                      className={
                        Number(
                          selectedStock.change.replace('%', '').replace('+', '')
                        ) > 0
                          ? 'positive'
                          : Number(
                            selectedStock.change.replace('%', '').replace('+', '')
                          ) < 0
                            ? 'negative'
                            : ''
                      }
                    >
                      {selectedStock.change}
                    </strong>
                  </div>
                </div>


                {/* SIMPLE TREND ANALYSIS */}

                <div className="analyzer-details">
                  <h3>Simple Trend Analysis</h3>

                  <p>
                    Trend:{' '}
                    <strong
                      className={
                        Number(
                          selectedStock.change.replace('%', '').replace('+', '')
                        ) > 0
                          ? 'positive'
                          : Number(
                            selectedStock.change.replace('%', '').replace('+', '')
                          ) < 0
                            ? 'negative'
                            : ''
                      }
                    >
                      {Number(
                        selectedStock.change.replace('%', '').replace('+', '')
                      ) > 0
                        ? 'Positive'
                        : Number(
                          selectedStock.change.replace('%', '').replace('+', '')
                        ) < 0
                          ? 'Negative'
                          : 'Neutral'}
                    </strong>
                  </p>

                  <p className="analyzer-note">
                    {Number(
                      selectedStock.change.replace('%', '').replace('+', '')
                    ) > 0
                      ? 'The stock is showing a positive daily change.'
                      : Number(
                        selectedStock.change.replace('%', '').replace('+', '')
                      ) < 0
                        ? 'The stock is showing a negative daily change.'
                        : 'The stock is showing no daily change.'}
                  </p>
                </div>

                <p className="analyzer-note">
                  Price data is provided by IndianAPI and may be delayed
                  or outdated. Trend analysis is based on daily percentage
                  change only. It is not historical technical analysis
                  or investment advice.
                </p>
              </div>
            ) : (
              <div className="analyzer-details">
                <h3>No stock selected</h3>

                <p className="analyzer-note">
                  {stockLoading
                    ? 'Waiting for stock data...'
                    : stockError
                      ? 'Stock data could not be loaded. Check your backend.'
                      : 'No stock data is currently available.'}
                </p>
              </div>
            )}
          </div>
        </section>


        {/* MARKET NEWS */}

        <section className="market-section" id="news">
          <div className="section-heading">
            <div>
              <h2>Market News</h2>
              <p>Sample Indian stock market headlines</p>
            </div>

            <span className="section-tag">DEMO NEWS</span>
          </div>

          <div className="news-grid">
            <article className="panel news-card">
              <span className="news-category">MARKET UPDATE</span>

              <h3>NIFTY 50 shows positive market momentum</h3>

              <p>
                Indian benchmark indices show simulated gains in this
                educational market dashboard.
              </p>

              <div className="news-meta">
                <span>Sample headline</span>
                <span>09:30 AM</span>
              </div>
            </article>

            <article className="panel news-card">
              <span className="news-category purple">BANKING</span>

              <h3>Banking stocks remain in investor focus</h3>

              <p>
                Banking sector stocks are monitored for illustrative
                daily price movements.
              </p>

              <div className="news-meta">
                <span>Sample headline</span>
                <span>10:15 AM</span>
              </div>
            </article>

            <article className="panel news-card">
              <span className="news-category orange">IT SECTOR</span>

              <h3>IT stocks attract market attention</h3>

              <p>
                Technology companies such as TCS and Infosys feature
                in this sample market news feed.
              </p>

              <div className="news-meta">
                <span>Sample headline</span>
                <span>11:00 AM</span>
              </div>
            </article>

            <article className="panel news-card">
              <span className="news-category">COMMODITIES</span>

              <h3>Gold and silver prices remain on watch</h3>

              <p>
                Precious metals are included in the dashboard's
                simulated commodity market overview.
              </p>

              <div className="news-meta">
                <span>Sample headline</span>
                <span>12:30 PM</span>
              </div>
            </article>
          </div>

          <p className="news-disclaimer">
            These are fictional sample headlines, not verified financial news.
          </p>
        </section>


        {/* TRADING SIGNALS */}

        <section className="market-section" id="signals">

          <div className="section-heading">
            <div>
              <h2>Trading Signals</h2>
              <p>Signals based on current stock price changes</p>
            </div>

            <span className="section-tag">API DATA</span>
          </div>

          <div className="signals-grid">

            {apiStocks.slice(0, 4).map((stock) => {

              const signal =
                stock.changeValue >= 1
                  ? "BUY"
                  : stock.changeValue <= -1
                    ? "SELL"
                    : "WATCH"

              return (
                <div className="panel signal-card" key={stock.name}>

                  <div className="signal-header">
                    <div>
                      <h3>{stock.name}</h3>
                      <p>{stock.name}</p>
                    </div>

                    <span
                      className={`signal-badge ${signal === "BUY"
                        ? "positive"
                        : signal === "SELL"
                          ? "negative"
                          : "neutral"
                        }`}
                    >
                      {signal}
                    </span>
                  </div>

                  <div className="signal-price">
                    ₹{stock.price}
                  </div>

                  <p>
                    Daily Change: {stock.change}
                  </p>

                  <p>
                    Signal based on daily price movement.
                  </p>

                </div>
              )
            })}

          </div>

          <p className="disclaimer">
            Educational demo only. Signals are rule-based examples,
            not AI predictions or investment advice.
          </p>

        </section>


        {/* PORTFOLIO */}

        <section className="market-section" id="portfolio">
          <div className="section-heading">
            <div>
              <h2>My Portfolio</h2>
              <p>Track your sample stock investments</p>
            </div>

            <span className="section-tag">DEMO PORTFOLIO</span>
          </div>
        </section>

        {/* PORTFOLIO SUMMARY */}

        <div
          className="portfolio-summary"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '18px',
            width: '100%',
            marginBottom: '25px',
          }}
        >
          <div
            className="panel portfolio-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'center',
              textAlign: 'left',
              padding: '24px',
              minWidth: 0,
              boxSizing: 'border-box',
            }}
          >
            <span>Total Investment</span>
            <h3>₹50,000.00</h3>
            <p>Sample invested amount</p>
          </div>

          <div
            className="panel portfolio-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'center',
              textAlign: 'left',
              padding: '24px',
              minWidth: 0,
              boxSizing: 'border-box',
            }}
          >
            <span>Current Value</span>
            <h3>₹51,250.00</h3>
            <p>Illustrative portfolio value</p>
          </div>

          <div
            className="panel portfolio-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'center',
              textAlign: 'left',
              padding: '24px',
              minWidth: 0,
              boxSizing: 'border-box',
            }}
          >
            <span>Total Profit / Loss</span>
            <h3 className="positive">+₹1,250.00</h3>
            <p className="positive">+2.50% sample return</p>
          </div>
        </div>

        {/* PAPER TRADING */}

        <section id="paper" className="paper-trading-section">
          <div className="section-heading">
            <div>
              <h2>Paper Trading</h2>
              <p>Practice stock trading with virtual money</p>
            </div>

            <span className="section-tag">VIRTUAL ONLY</span>
          </div>

          {/* VIRTUAL BALANCE */}

          <div className="panel portfolio-card">
            <span>Virtual Balance</span>

            <h3>
              {paperBalance.toLocaleString('en-IN', {
                style: 'currency',
                currency: 'INR',
                minimumFractionDigits: 2,
              })}
            </h3>

            <p>Demo trading account · No real money</p>
          </div>

          {/* BUY STOCK */}

          <div className="panel portfolio-card">
            <h3>Buy Stock</h3>

            <div className="add-stock-fields">
              <label htmlFor="paper-stock">Stock Symbol</label>

              <select
                id="paper-stock"
                value={paperStock}
                onChange={(e) => {
                  const symbol = e.target.value

                  setPaperStock(symbol)

                  const stock = apiStocks.find(
                    (item) => item.name === symbol
                  )

                  // Fill the price with API price when available.
                  setPaperPrice(
                    stock && stock.priceValue > 0
                      ? stock.priceValue.toString()
                      : ''
                  )
                }}
              >
                <option value="">Select stock</option>

                {apiStocks.map((stock) => (
                  <option key={stock.name} value={stock.name}>
                    {stock.name}
                  </option>
                ))}
              </select>

              <label htmlFor="paper-quantity">Quantity</label>

              <input
                id="paper-quantity"
                type="number"
                min="1"
                step="1"
                placeholder="Enter quantity"
                value={paperQuantity}
                onChange={(e) => setPaperQuantity(e.target.value)}
              />

              <label htmlFor="paper-price">Demo Price (₹)</label>

              <input
                id="paper-price"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Enter stock price"
                value={paperPrice}
                onChange={(e) => setPaperPrice(e.target.value)}
              />
            </div>

            <p>
              Estimated Cost: ₹
              {(
                Number(paperQuantity || 0) *
                Number(paperPrice || 0)
              ).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>

            <p className="analyzer-note">
              API prices may be delayed. You can edit the demo price
              for practice. This does not place a real stock order.
            </p>

            <button
              className="add-stock-button"
              onClick={handleBuyStock}
              disabled={apiStocks.length === 0}
            >
              Buy Stock
            </button>
          </div>

          {/* PAPER HOLDINGS */}

          <div className="panel portfolio-card">
            <h3>Paper Trading Holdings</h3>

            {paperHoldings.length === 0 ? (
              <p>No demo stocks purchased yet.</p>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Stock</th>
                      <th>Quantity</th>
                      <th>Buy Price</th>
                      <th>Total Cost</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paperHoldings.map((stock, index) => (
                      <tr key={`${stock.symbol}-${index}`}>
                        <td>{stock.symbol}</td>

                        <td>{stock.quantity}</td>

                        <td>₹{stock.price.toFixed(2)}</td>

                        <td>
                          ₹
                          {(stock.quantity * stock.price).toLocaleString(
                            'en-IN',
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </td>

                        <td>
                          <button
                            className="sell-stock-button"
                            onClick={() => handleSellStock(index)}
                          >
                            Sell Stock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* FOOTER */}

        <footer className="footer">
          BharatTrade AI · Educational demo dashboard · No live trading
        </footer>
      </main >
    </div >
  )
}

export default App
