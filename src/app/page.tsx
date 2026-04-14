"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import styles from "./page.module.css";
import Link from "next/link";
import { 
  getMostFavoredHumorFlavor, 
  getMostAgreedCaptionAndImage,
  getNewUsersLastThreeMonths,
  getVotesPastThreeWeeks,
  getHighImpactCreations,
  getTopPerformingModel,
  getRecentlyRatedCaptions,
  getTrendingCaption,
  getVotesLast24Hours,
  getTop3Captions
} from "@/lib/stats";

interface Stat {
  label: string;
  value: string;
  trend?: string;
  up?: boolean;
  neutral?: boolean;
  imageUrl?: string;
  isLongText?: boolean;
  isList?: boolean;
  chartData?: number[];
}

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState<Stat[]>([
    { label: "Top Rated All-Time", value: "Loading...", isLongText: true, isList: true },
    { label: "Captions Users Are Rating", value: "Loading...", isLongText: true, isList: true },
    { label: "24H Voting Surge", value: "Loading...", trend: "Past 24 hours" },
    { label: "Trending Caption Now", value: "Loading...", isLongText: true },
    { label: "Community-Approved Gems", value: "Loading..." },
    { label: "Total Votes Cast This Past Week", value: "Loading..." },
    { label: "Most Agreed Caption & Image", value: "Loading...", isLongText: true },
    { label: "New Users (Past 3 Months)", value: "Loading...", trend: "Updating", up: true },
    { label: "Most Favored Humor Flavor", value: "Loading...", isLongText: true },
    { label: "Most Humorous AI Model", value: "Loading..." },
  ]);

  useEffect(() => {
    async function loadStats() {
      const highImpact = await getHighImpactCreations();
      const topModel = await getTopPerformingModel();
      const mostFavored = await getMostFavoredHumorFlavor();
      const mostAgreedData = await getMostAgreedCaptionAndImage();
      const newUsers = await getNewUsersLastThreeMonths();
      const votesData = await getVotesPastThreeWeeks(); // [current, week2, week3]
      const recentCaptions = await getRecentlyRatedCaptions();
      const trending = await getTrendingCaption();
      const votes24h = await getVotesLast24Hours();
      const top3 = await getTop3Captions();
      
      const currentVotes = votesData[0];
      const prevWeeksAvg = (votesData[1] + votesData[2]) / 2;
      const votesDiff = prevWeeksAvg === 0 ? (currentVotes > 0 ? 100 : 0) : Math.round(((currentVotes - prevWeeksAvg) / prevWeeksAvg) * 100);

      setStats(prev => {
        const newStats = [...prev];
        
        // 0: Top Rated All-Time
        newStats[0] = { 
          ...newStats[0], 
          value: top3.length > 0 ? top3.map(c => `${c.content} (${c.like_count} likes)`).join("\n") : "No ratings yet"
        };

        // 1: Captions Users Are Rating
        newStats[1] = { 
          ...newStats[1], 
          value: recentCaptions.length > 0 ? recentCaptions.join("\n") : "No recent activity"
        };

        // 2: 24H Voting Surge
        newStats[2] = { 
          ...newStats[2], 
          value: `${votes24h.toLocaleString()} votes`,
          up: votes24h > 0
        };

        // 3: Trending Now
        newStats[3] = { 
          ...newStats[3], 
          value: trending ? `"${trending.content}"` : "None yet",
          trend: trending ? `${trending.count} votes this week` : "0 votes this week",
          neutral: true
        };

        // 4: Community-Approved Gems
        newStats[4] = { ...newStats[4], value: highImpact };

        // 5: Total Votes Cast This Past Week
        newStats[5] = { 
          ...newStats[5], 
          value: currentVotes.toLocaleString(), 
          trend: `${votesDiff >= 0 ? "+" : ""}${votesDiff}% vs 3-week avg`,
          up: votesDiff >= 0,
          chartData: [...votesData].reverse() // [week3, week2, current] for left-to-right chart
        };

        // 6: Most Agreed Caption & Image
        if (mostAgreedData) {
          newStats[6] = { 
            ...newStats[6], 
            value: mostAgreedData.caption, 
            imageUrl: mostAgreedData.imageUrl || undefined 
          };
        } else {
          newStats[6] = { ...newStats[6], value: "No data available" };
        }
        
        // 7: New Users (Past 3 Months)
        newStats[7] = { ...newStats[7], value: newUsers, trend: "Community Growth", up: true };
        
        // 8: Most Favored Humor Flavor
        newStats[8] = { ...newStats[8], value: mostFavored };
        
        // 9: Most Humorous AI Model
        newStats[9] = { 
          ...newStats[9], 
          value: topModel.split(":")[0]?.trim() || topModel,
          trend: topModel.includes("(") ? topModel.substring(topModel.indexOf("(")) : ""
        };
        
        return newStats;
      });
    }
    loadStats();
  }, []);

  const renderChart = (data: number[]) => {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data, 1);
    const height = 60;
    const width = 180;
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - (val / max) * (height - 20) - 10; // Add padding for labels
      return `${x},${y}`;
    }).join(" ");

    const areaPoints = `${points} ${width},${height} 0,${height}`;

    return (
      <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <svg width={width} height={height} style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ade80" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            points={areaPoints}
            fill="url(#chartGradient)"
          />
          <polyline
            fill="none"
            stroke="#4ade80"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          {data.map((val, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - (val / max) * (height - 20) - 10;
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#4ade80"
                />
                <text
                  x={x}
                  y={y - 10}
                  textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {val.toLocaleString()}
                </text>
              </g>
            );
          })}
        </svg>
        <span style={{ fontSize: '10px', color: '#888', fontWeight: 700, letterSpacing: '0.05em' }}>WEEKLY ENGAGEMENT</span>
      </div>
    );
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className={styles.page}>
      <main className={styles.main} style={{ gap: '0' }}>
        <style>{`
          .manage-domain-btn {
            padding: 14px 28px !important;
            text-decoration: none !important;
            background-color: #111 !important;
            border: 1px solid #333 !important;
            border-radius: 8px !important;
            color: #fff !important;
            font-size: 14px !important;
            font-weight: 700 !important;
            letter-spacing: 0.1em !important;
            transition: all 0.2s ease-in-out !important;
            display: inline-block !important;
            cursor: pointer !important;
          }
          .manage-domain-btn:hover {
            background-color: #4ade80 !important;
            color: #000 !important;
            border-color: #4ade80 !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 4px 20px rgba(74, 222, 128, 0.4) !important;
          }
          .sign-out-btn {
            padding: 8px 16px !important;
            border-radius: 4px !important;
            border: 1px solid #333 !important;
            background-color: transparent !important;
            color: #888 !important;
            font-size: 12px !important;
            font-weight: 700 !important;
            cursor: pointer !important;
            transition: all 0.2s ease-in-out !important;
            text-transform: uppercase !important;
          }
          .sign-out-btn:hover {
            background-color: #f87171 !important;
            color: #000 !important;
            border-color: #f87171 !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 4px 20px rgba(248, 113, 113, 0.4) !important;
          }
        `}</style>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '20px' }}>
          <div className={styles.header} style={{ gap: '8px' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <h1 style={{ margin: 0 }}>Admin Panel</h1>
            </Link>
            <p style={{ margin: 0 }}>
              Real-time analytics and community performance metrics.
            </p>
          </div>
          <button 
            onClick={handleSignOut}
            className="sign-out-btn"
          >
            SIGN OUT
          </button>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <Link href="/admin/users" className="manage-domain-btn">
            MANAGE DOMAIN MODEL
          </Link>
        </div>

        <div className={styles.statsGrid}>
          {stats.map((stat, index) => (
            <div key={index} className={styles.statCard}>
              <div 
                className={styles.statContent} 
                style={index === 4 ? { 
                  alignItems: 'stretch', 
                  textAlign: 'left',
                  height: '100%'
                } : {}}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className={styles.statLabel}>{stat.label}</span>
                  {stat.chartData && renderChart(stat.chartData)}
                </div>
                
                {stat.imageUrl ? (
                  <>
                    <div className={styles.statImageContainer}>
                      <img 
                        src={stat.imageUrl} 
                        alt="Agreed visual" 
                        className={styles.statImage}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <span className={`${styles.statValue} ${styles.textSmall}`}>
                      "{stat.value}"
                    </span>
                  </>
                ) : index === 5 ? (
                  <div className={styles.centeredStat} style={{ marginTop: '0', gap: '4px' }}>
                    <span className={styles.statValue} style={{ fontSize: '28px', textAlign: 'center', width: '100%', color: '#ffffff' }}>
                      {stat.value.split(":")[0]}
                    </span>
                    <span className={styles.statValue} style={{ fontSize: '24px', textAlign: 'center', width: '100%', color: '#aaaaaa' }}>
                      {stat.value.split(":")[1]?.trim()}
                    </span>
                  </div>
                ) : stat.isList ? (
                  <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', width: '100%' }}>
                    <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'disc', color: '#f0f0f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {stat.value.split('\n').map((item, i) => (
                        <li key={i} style={{ fontSize: '18px', fontWeight: 600, lineHeight: '1.4' }}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : index === 3 ? ( // Total Votes Cast This Past Week (previously index 4)
                  <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className={styles.statValue} style={{ fontSize: '48px' }}>
                      {stat.value}
                    </span>
                  </div>
                ) : (
                  <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className={`${styles.statValue} ${stat.isLongText ? styles.textSmall : ''}`}>
                      {stat.value}
                    </span>
                  </div>
                )}
              </div>
              
              {stat.trend && (
                <div className={`${styles.statTrend} ${stat.neutral ? styles.trendNeutral : stat.up ? styles.trendUp : styles.trendDown}`}>
                  {!stat.neutral && (stat.up ? "↑" : "↓")} {stat.trend}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
