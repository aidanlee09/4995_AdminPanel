import { supabase } from "./supabase";

/**
 * first statistic: get the llm system prompt with the highest magnitude of votes
 */
export async function getTopSystemPrompt() {
  if (!supabase) return "Supabase not configured";
  try {
    const { data: topLikes } = await supabase
      .from("captions")
      .select("llm_prompt_chain_id, like_count")
      .not("llm_prompt_chain_id", "is", null)
      .order("like_count", { ascending: false })
      .limit(1);

    const { data: bottomLikes } = await supabase
      .from("captions")
      .select("llm_prompt_chain_id, like_count")
      .not("llm_prompt_chain_id", "is", null)
      .order("like_count", { ascending: true })
      .limit(1);

    let targetChainId: string | null = null;
    let maxMagnitude = -1;

    if (topLikes && topLikes.length > 0) {
      const mag = Math.abs(topLikes[0].like_count || 0);
      maxMagnitude = mag;
      targetChainId = topLikes[0].llm_prompt_chain_id;
    }

    if (bottomLikes && bottomLikes.length > 0) {
      const mag = Math.abs(bottomLikes[0].like_count || 0);
      if (mag > maxMagnitude) {
        targetChainId = bottomLikes[0].llm_prompt_chain_id;
      }
    }

    if (!targetChainId) {
      const { data: chainData } = await supabase
        .from("llm_prompt_chains")
        .select("id")
        .limit(1)
        .single();
      targetChainId = chainData?.id || null;
    }

    // Try to get the system prompt for the target chain
    if (targetChainId) {
      const { data: responseData } = await supabase
        .from("llm_model_responses")
        .select("llm_system_prompt")
        .eq("llm_prompt_chain_id", targetChainId)
        .not("llm_system_prompt", "is", null)
        .not("llm_system_prompt", "ilike", "n/a")
        .limit(1)
        .single();

      const prompt = responseData?.llm_system_prompt?.trim();
      if (prompt && prompt.toUpperCase() !== "N/A" && prompt.length > 0) {
        return prompt;
      }
    }

    // Fallback: Get the absolute latest system prompt available in the system
    const { data: fallbackData } = await supabase
      .from("llm_model_responses")
      .select("llm_system_prompt")
      .not("llm_system_prompt", "is", null)
      .not("llm_system_prompt", "ilike", "n/a")
      .order("created_datetime_utc", { ascending: false })
      .limit(1)
      .single();

    const fallbackPrompt = fallbackData?.llm_system_prompt?.trim();
    if (fallbackPrompt && fallbackPrompt.toUpperCase() !== "N/A" && fallbackPrompt.length > 0) {
      return fallbackPrompt;
    }

    return "No valid system prompts found in database.";
  } catch (error) {
    console.error(error);
    return "Error: Could not retrieve system prompt.";
  }
}

/**
 * flavor with the highest average likes per caption
 */
export async function getHighestRatedHumorFlavor() {
  if (!supabase) return "0 upvotes";
  try {
    const { data: captions } = await supabase
      .from("captions")
      .select("like_count, humor_flavor_id")
      .not("humor_flavor_id", "is", null);

    if (!captions || captions.length === 0) return "0 upvotes";

    const flavorStats: Record<string, { total: number; count: number }> = {};
    captions.forEach(c => {
      const id = c.humor_flavor_id;
      if (!flavorStats[id]) flavorStats[id] = { total: 0, count: 0 };
      flavorStats[id].total += (c.like_count || 0);
      flavorStats[id].count += 1;
    });

    let bestFlavorId = null;
    let bestAvg = -Infinity;

    for (const id in flavorStats) {
      const avg = flavorStats[id].total / flavorStats[id].count;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestFlavorId = id;
      }
    }

    if (!bestFlavorId) return "0 upvotes";

    const { data: flavor } = await supabase
      .from("humor_flavors")
      .select("slug")
      .eq("id", bestFlavorId)
      .single();

    const absAvg = Math.abs(bestAvg).toFixed(1);
    const suffix = bestAvg < 0 ? "downvotes" : "upvotes";
    return `${flavor?.slug?.toUpperCase() || "UNKNOWN"}: ${absAvg} ${suffix}`;
  } catch (error) {
    console.error(error);
    return "Error";
  }
}

/**
 * most favored humor flavor
 */
export async function getMostFavoredHumorFlavor() {
  if (!supabase) return "No Data";
  try {
    const { data: captionData } = await supabase
      .from("captions")
      .select("humor_flavor_id, content, like_count")
      .gt("like_count", 0)
      .not("humor_flavor_id", "is", null)
      .order("like_count", { ascending: false })
      .limit(1)
      .single();

    if (captionData) {
      const { data: flavorData } = await supabase
        .from("humor_flavors")
        .select("slug, description")
        .eq("id", captionData.humor_flavor_id)
        .single();

      if (flavorData) {
        return `${flavorData.slug} - ${flavorData.description}`;
      }
    }

    // Fallback: Get the latest flavor if no favored one exists
    const { data: latestFlavor } = await supabase
      .from("humor_flavors")
      .select("slug, description")
      .limit(1)
      .single();

    if (latestFlavor) {
      return `${latestFlavor.slug} - ${latestFlavor.description}`;
    }

    return "No flavors found";
  } catch (error) {
    console.error(error);
    return "Error fetching flavor";
  }
}

/**
 * most agreed caption and image
 */
export async function getMostAgreedCaptionAndImage() {
  if (!supabase) return null;
  try {
    const { data: topLikes } = await supabase
      .from("captions")
      .select("content, image_id, like_count")
      .order("like_count", { ascending: false })
      .limit(1);

    const { data: bottomLikes } = await supabase
      .from("captions")
      .select("content, image_id, like_count")
      .order("like_count", { ascending: true })
      .limit(1);

    let winner = null;
    let maxMagnitude = -1;

    if (topLikes && topLikes.length > 0) {
      const mag = Math.abs(topLikes[0].like_count || 0);
      maxMagnitude = mag;
      winner = topLikes[0];
    }

    if (bottomLikes && bottomLikes.length > 0) {
      const mag = Math.abs(bottomLikes[0].like_count || 0);
      if (mag > maxMagnitude) {
        winner = bottomLikes[0];
      }
    }

    if (!winner || !winner.image_id) return null;

    const { data: imageData } = await supabase
      .from("images")
      .select("url")
      .eq("id", winner.image_id)
      .single();

    if (!imageData) return { caption: winner.content, imageUrl: null };
    return { caption: winner.content, imageUrl: imageData.url };
  } catch (error) {
    console.error(error);
    return null;
  }
}

/**
 * New Users Past 3 Months
 */
export async function getNewUsersLastThreeMonths() {
  if (!supabase) return "0";
  try {
    const { data: captionData } = await supabase.from("captions").select("profile_id, created_datetime_utc");
    const { data: voteData } = await supabase.from("caption_votes").select("profile_id, created_datetime_utc");

    const firstSeen: Record<string, Date> = {};
    const processData = (items: any[] | null) => {
      items?.forEach(d => {
        if (!d.profile_id || !d.created_datetime_utc) return;
        const date = new Date(d.created_datetime_utc);
        if (!firstSeen[d.profile_id] || date < firstSeen[d.profile_id]) {
          firstSeen[d.profile_id] = date;
        }
      });
    };

    processData(captionData);
    processData(voteData);

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    let count = 0;
    Object.values(firstSeen).forEach(date => {
      if (date >= threeMonthsAgo) count++;
    });

    return count.toString();
  } catch (error) {
    console.error(error);
    return "0";
  }
}

/**
 * Total Votes Past 3 Weeks
 */
export async function getVotesPastThreeWeeks() {
  if (!supabase) return [0, 0, 0];
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);

    const fetchRange = async (start: Date, end: Date) => {
      if (!supabase) return 0;
      const { count } = await supabase
        .from("caption_votes")
        .select("*", { count: "exact", head: true })
        .gte("created_datetime_utc", start.toISOString())
        .lt("created_datetime_utc", end.toISOString());
      return count || 0;
    };

    const currentWeek = await fetchRange(oneWeekAgo, now);
    const week2 = await fetchRange(twoWeeksAgo, oneWeekAgo);
    const week3 = await fetchRange(threeWeeksAgo, twoWeeksAgo);

    return [currentWeek, week2, week3];
  } catch (error) {
    console.error(error);
    return [0, 0, 0];
  }
}

/**
 * High impact creations: captions with positive engagement vs total
 */
export async function getHighImpactCreations() {
  if (!supabase) return "0 / 0";
  try {
    const { count: total } = await supabase
      .from("captions")
      .select("*", { count: "exact", head: true });
    
    const { count: positive } = await supabase
      .from("captions")
      .select("*", { count: "exact", head: true })
      .gt("like_count", 0);
    
    return `${positive?.toLocaleString()} / ${total?.toLocaleString()} captions`;
  } catch (error) {
    console.error(error);
    return "Error";
  }
}

/**
 * Model with the highest percentage of positively rated captions
 */
export async function getTopPerformingModel() {
  if (!supabase) return "None";
  try {
    // Get all captions with their chain IDs and like counts
    const { data: captions } = await supabase
      .from("captions")
      .select("llm_prompt_chain_id, like_count")
      .not("llm_prompt_chain_id", "is", null);

    if (!captions || captions.length === 0) return "None";

    // Get all model responses to map chain ID to model ID
    const { data: responses } = await supabase
      .from("llm_model_responses")
      .select("llm_prompt_chain_id, llm_model_id")
      .not("llm_prompt_chain_id", "is", null);

    if (!responses || responses.length === 0) return "None";

    const chainToModel: Record<string, string> = {};
    responses.forEach(r => {
      chainToModel[r.llm_prompt_chain_id] = r.llm_model_id;
    });

    const modelStats: Record<string, { positive: number; total: number }> = {};
    captions.forEach(c => {
      const modelId = chainToModel[c.llm_prompt_chain_id];
      if (!modelId) return;
      if (!modelStats[modelId]) modelStats[modelId] = { positive: 0, total: 0 };
      modelStats[modelId].total++;
      if ((c.like_count || 0) > 0) {
        modelStats[modelId].positive++;
      }
    });

    let bestModelId = "";
    let bestRate = -1;

    for (const id in modelStats) {
      const rate = modelStats[id].positive / modelStats[id].total;
      if (rate > bestRate) {
        bestRate = rate;
        bestModelId = id;
      }
    }

    if (!bestModelId) return "None";

    const { data: modelData } = await supabase
      .from("llm_models")
      .select("name")
      .eq("id", bestModelId)
      .single();

    return `${modelData?.name || bestModelId} (${(bestRate * 100).toFixed(1)}% Success)`;
  } catch (error) {
    console.error(error);
    return "Error";
  }
}

/**
 * Get the most recently rated captions
 */
export async function getRecentlyRatedCaptions() {
  if (!supabase) return [];
  try {
    const { data: recentVotes } = await supabase
      .from("caption_votes")
      .select("caption_id, created_datetime_utc")
      .order("created_datetime_utc", { ascending: false })
      .limit(20);

    if (!recentVotes || recentVotes.length === 0) return [];

    const uniqueCaptionIds = Array.from(new Set(recentVotes.map(v => v.caption_id))).slice(0, 3);
    
    const { data: captions } = await supabase
      .from("captions")
      .select("id, content")
      .in("id", uniqueCaptionIds);

    if (!captions) return [];

    // Maintain order from uniqueCaptionIds
    return uniqueCaptionIds
      .map(id => captions.find((c: any) => c.id === id)?.content)
      .filter(Boolean);
  } catch (error) {
    console.error(error);
    return [];
  }
}

/**
 * Get the caption with the most votes in the last 7 days
 */
export async function getTrendingCaption() {
  if (!supabase) return null;
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentVotes } = await supabase
      .from("caption_votes")
      .select("caption_id")
      .gte("created_datetime_utc", sevenDaysAgo.toISOString());

    if (!recentVotes || recentVotes.length === 0) return null;

    const voteCounts: Record<string, number> = {};
    recentVotes.forEach(v => {
      voteCounts[v.caption_id] = (voteCounts[v.caption_id] || 0) + 1;
    });

    let trendingId = null;
    let maxVotes = 0;
    for (const id in voteCounts) {
      if (voteCounts[id] > maxVotes) {
        maxVotes = voteCounts[id];
        trendingId = id;
      }
    }

    if (!trendingId) return null;

    const { data: caption } = await supabase
      .from("captions")
      .select("content")
      .eq("id", trendingId)
      .single();

    return {
      content: caption?.content || "Unknown",
      count: maxVotes
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

/**
 * Get total votes in the last 24 hours
 */
export async function getVotesLast24Hours() {
  if (!supabase) return 0;
  try {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { count } = await supabase
      .from("caption_votes")
      .select("*", { count: "exact", head: true })
      .gte("created_datetime_utc", twentyFourHoursAgo.toISOString());

    return count || 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
}

/**
 * Get top 3 most liked captions of all time
 */
export async function getTop3Captions() {
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from("captions")
      .select("content, like_count")
      .order("like_count", { ascending: false })
      .limit(3);

    return data || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}
