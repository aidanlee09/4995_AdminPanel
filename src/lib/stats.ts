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

    if (!targetChainId) return "No Data";

    const { data: responseData, error: responseError } = await supabase
      .from("llm_model_responses")
      .select("llm_system_prompt")
      .eq("llm_prompt_chain_id", targetChainId)
      .limit(1)
      .single();

    if (responseError || !responseData) return "N/A";
    return responseData.llm_system_prompt || "N/A";
  } catch (error) {
    console.error(error);
    return "Error";
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
  if (!supabase) return "N/A";
  try {
    const { data: captionData } = await supabase
      .from("captions")
      .select("humor_flavor_id, content, like_count")
      .gt("like_count", 0)
      .not("humor_flavor_id", "is", null)
      .order("like_count", { ascending: false })
      .limit(1)
      .single();

    if (!captionData) return "No favored flavor";

    const { data: flavorData } = await supabase
      .from("humor_flavors")
      .select("slug, description")
      .eq("id", captionData.humor_flavor_id)
      .single();

    if (!flavorData) return "N/A";
    return `${flavorData.slug} - ${flavorData.description}`;
  } catch (error) {
    console.error(error);
    return "Error";
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
