"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import styles from "./page.module.css";
import Link from "next/link";
import { 
  getTopSystemPrompt, 
  getMostFavoredHumorFlavor, 
  getMostAgreedCaptionAndImage,
  getNewUsersLastThreeMonths,
  getVotesPastThreeWeeks,
  getHighestRatedHumorFlavor
} from "@/lib/stats";

interface Stat {
  label: string;
  value: string;
  trend?: string;
  up?: boolean;
  neutral?: boolean;
  imageUrl?: string;
  isLongText?: boolean;
  chartData?: number[];
}

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState<Stat[]>([
    { label: "New Users (Past 3 Months)", value: "Loading...", trend: "Updating", up: true },
    { label: "Most Favored Humor Flavor", value: "Loading...", isLongText: true },
    { label: "Top System Prompt", value: "Loading...", isLongText: true },
    { label: "Most Agreed Caption & Image", value: "Loading...", isLongText: true },
    { label: "Total Votes Cast This Past Week", value: "Loading..." },
    { label: "Highest Rated Humor Style (Average Engagement)", value: "Loading..." },
  ]);

  useEffect(() => {
    async function loadStats() {
      const topPrompt = await getTopSystemPrompt();
      const highestRatedFlavor = await getHighestRatedHumorFlavor();
      const mostFavored = await getMostFavoredHumorFlavor();
      const mostAgreedData = await getMostAgreedCaptionAndImage();
      const newUsers = await getNewUsersLastThreeMonths();
      const votesData = await getVotesPastThreeWeeks(); // [current, week2, week3]
      
      const currentVotes = votesData[0];
      const prevWeeksAvg = (votesData[1] + votesData[2]) / 2;
      const votesDiff = prevWeeksAvg === 0 ? (currentVotes > 0 ? 100 : 0) : Math.round(((currentVotes - prevWeeksAvg) / prevWeeksAvg) * 100);

      // Extract the first sentence
      const sentenceMatch = topPrompt.match(/^.*?[.!?](\s|$)/);
      const firstSentence = sentenceMatch ? sentenceMatch[0].trim() : topPrompt;

      setStats(prev => {
        const newStats = [...prev];
        
        // 0: New Users (Past 3 Months)
        newStats[0] = { ...newStats[0], value: newUsers, trend: "Community Growth", up: true };
        
        // 1: Most Favored Humor Flavor
        newStats[1] = { ...newStats[1], value: mostFavored };
        
        // 2: Top System Prompt
        newStats[2] = { ...newStats[2], value: firstSentence };
        
        // 3: Most Agreed Caption & Image
        if (mostAgreedData) {
          newStats[3] = { 
            ...newStats[3], 
            value: mostAgreedData.caption, 
            imageUrl: mostAgreedData.imageUrl || undefined 
          };
        } else {
          newStats[3] = { ...newStats[3], value: "No data available" };
        }

        // 4: Total Votes Cast This Past Week
        newStats[4] = { 
          ...newStats[4], 
          value: currentVotes.toLocaleString(), 
          trend: `${votesDiff >= 0 ? "+" : ""}${votesDiff}% vs 3-week avg`,
          up: votesDiff >= 0,
          chartData: [...votesData].reverse() // [week3, week2, current] for left-to-right chart
        };

        // 5: Highest Rated Humor Style
        newStats[5] = { ...newStats[5], value: highestRatedFlavor };
        
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
        `}</style>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '20px' }}>
          <div className={styles.header} style={{ gap: '8px' }}>
            <h1 style={{ margin: 0 }}>Admin Panel</h1>
            <p style={{ margin: 0 }}>
              Real-time analytics and community performance metrics.
            </p>
          </div>
          <button 
            onClick={handleSignOut}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid #333',
              backgroundColor: 'transparent',
              color: '#888',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
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
                ) : index === 4 ? (
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
