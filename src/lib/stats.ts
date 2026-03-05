import { supabase } from "./supabase";

/**
 * first statistic: get the llm system prompt with the highest magnitude of votes
 * - from llm_model_responses table get ‘llm_system_prompt’ and ‘llm_prompt_chain_id’
 * - from llm_prompt_chains table get the ‘id’. this is the llm_prompt_chain_id, if its null get another id
 * - from captions table, get the caption based on ’llm_prompt_chain_id’ and with the highest magnitude of ‘like_count’.
 * - return the llm system prompt based on these joins
 */
export async function getTopSystemPrompt() {
  try {
    // 1. Find the caption with the highest absolute magnitude of likes
    // We check both the most liked and most disliked to find the largest magnitude
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

    // Fallback if no caption with chain ID is found
    if (!targetChainId) {
      const { data: chainData } = await supabase
        .from("llm_prompt_chains")
        .select("id")
        .limit(1)
        .single();
      targetChainId = chainData?.id || null;
    }

    if (!targetChainId) return "No Data";

    // 2. Fetch the llm_system_prompt specifically (NOT llm_user_prompt)
    const { data: responseData, error: responseError } = await supabase
      .from("llm_model_responses")
      .select("llm_system_prompt")
      .eq("llm_prompt_chain_id", targetChainId)
      .limit(1)
      .single();

    if (responseError || !responseData) {
      console.error("Error fetching system prompt:", responseError);
      return "N/A";
    }

    return responseData.llm_system_prompt || "N/A";
  } catch (error) {
    console.error("Unexpected error in getTopSystemPrompt:", error);
    return "Error";
  }
}

/**
 * average ‘like_count’ of captions using the Columbia University student analogy selector llm user prompt.
 * if the average is a negative value, display the number with the word ‘downvotes’ after it.
 * if number is positive, display the number with the word ‘upvotes’ after it
 */
export async function getColumbiaAnalogyAverageLikes() {
  try {
    // 1. Get all chain IDs associated with the "Columbia University student analogy selector" user prompt
    const { data: responses, error: responseError } = await supabase
      .from("llm_model_responses")
      .select("llm_prompt_chain_id")
      .ilike("llm_user_prompt", "%Columbia University student analogy selector%");

    if (responseError || !responses || responses.length === 0) {
      console.error("Error fetching Columbia analogy responses:", responseError);
      // Fallback: try searching for a shorter version if exact match fails
      const { data: fallbackResponses } = await supabase
        .from("llm_model_responses")
        .select("llm_prompt_chain_id")
        .ilike("llm_user_prompt", "%Columbia University%")
        .limit(100);
      
      if (!fallbackResponses || fallbackResponses.length === 0) return "0 upvotes";
      
      const chainIds = fallbackResponses
        .map(r => r.llm_prompt_chain_id)
        .filter((id): id is string => !!id);
        
      return await calculateAverage(chainIds);
    }

    const chainIds = responses
      .map(r => r.llm_prompt_chain_id)
      .filter((id): id is string => !!id);

    return await calculateAverage(chainIds);
  } catch (error) {
    console.error("Unexpected error in getColumbiaAnalogyAverageLikes:", error);
    return "Error";
  }
}

async function calculateAverage(chainIds: string[]) {
  if (chainIds.length === 0) return "0 upvotes";

  const { data: captions, error: captionError } = await supabase
    .from("captions")
    .select("like_count")
    .in("llm_prompt_chain_id", chainIds.slice(0, 100)); // Limit to avoid huge queries

  if (captionError || !captions || captions.length === 0) {
    return "0 upvotes";
  }

  const totalLikes = captions.reduce((acc, curr) => acc + (curr.like_count || 0), 0);
  const average = totalLikes / captions.length;

  const absoluteAverage = Math.abs(average).toFixed(1);
  return average < 0 ? `${absoluteAverage} downvotes` : `${absoluteAverage} upvotes`;
}

/**
 * most favored humor flavor
 * - from captions table, get the caption (‘content’) with the highest ‘like_count’ (positive likes) and ‘humor_flavor_id’
 * - from humor_flavors table, get the ‘id’. this is the ‘humor_flavor_id’. also get the associated ‘slug’, and ‘description’ this is the most favored humor flavor
 */
export async function getMostFavoredHumorFlavor() {
  try {
    // 1. Get caption with highest positive like_count and humor_flavor_id
    const { data: captionData, error: captionError } = await supabase
      .from("captions")
      .select("humor_flavor_id, content, like_count")
      .gt("like_count", 0) // ensure positive likes
      .not("humor_flavor_id", "is", null)
      .order("like_count", { ascending: false })
      .limit(1)
      .single();

    if (captionError || !captionData) {
      console.error("Error fetching highest liked caption:", captionError);
      return "No favored flavor";
    }

    // 2. Get slug and description from humor_flavors
    const { data: flavorData, error: flavorError } = await supabase
      .from("humor_flavors")
      .select("slug, description")
      .eq("id", captionData.humor_flavor_id)
      .single();

    if (flavorError || !flavorData) {
      console.error("Error fetching humor flavor:", flavorError);
      return "N/A";
    }

    // Return the slug or description
    return `${flavorData.slug} - ${flavorData.description}`;
  } catch (error) {
    console.error("Unexpected error in getMostFavoredHumorFlavor:", error);
    return "Error";
  }
}

/**
 * most agreed caption and image (highest magnitude of votes)
 * - from captions table, get the caption (‘content’) and image (‘image_id’) with the highest magnitude of ‘like_count’.
 * - map to ‘images’ table, ‘id’ column and display the link from ‘url’
 */
export async function getMostAgreedCaptionAndImage() {
  try {
    // 1. Get caption with highest magnitude of like_count
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

    if (!winner || !winner.image_id) {
      return null;
    }

    // 2. Get image URL
    const { data: imageData, error: imageError } = await supabase
      .from("images")
      .select("url")
      .eq("id", winner.image_id)
      .single();

    if (imageError || !imageData) {
      console.error("Error fetching image:", imageError);
      return { caption: winner.content, imageUrl: null };
    }

    return { caption: winner.content, imageUrl: imageData.url };
  } catch (error) {
    console.error("Unexpected error in getMostAgreedCaptionAndImage:", error);
    return null;
  }
}

/**
 * Total Active Community Members
 * - Union of unique profile_ids from captions and caption_votes tables
 */
export async function getActiveCommunityMembers() {
  try {
    const { data: captionProfiles } = await supabase
      .from("captions")
      .select("profile_id");
    
    const { data: voteProfiles } = await supabase
      .from("caption_votes")
      .select("profile_id");

    const uniqueIds = new Set();
    captionProfiles?.forEach(p => p.profile_id && uniqueIds.add(p.profile_id));
    voteProfiles?.forEach(p => p.profile_id && uniqueIds.add(p.profile_id));

    return uniqueIds.size.toLocaleString();
  } catch (error) {
    console.error("Unexpected error in getActiveCommunityMembers:", error);
    return "0";
  }
}

/**
 * Total Community Votes Cast
 * - count of all rows in caption_votes table
 */
export async function getTotalVotesCast() {
  try {
    const { count, error } = await supabase
      .from("caption_votes")
      .select("*", { count: "exact", head: true });

    if (error) throw error;
    return (count || 0).toLocaleString();
  } catch (error) {
    console.error("Unexpected error in getTotalVotesCast:", error);
    return "0";
  }
}

/**
 * New Users Past 3 Months
 * - Count of unique profile_ids whose earliest activity (caption or vote) is in the last 90 days
 */
export async function getNewUsersLastThreeMonths() {
  try {
    const { data: captionData } = await supabase
      .from("captions")
      .select("profile_id, created_datetime_utc");
    
    const { data: voteData } = await supabase
      .from("caption_votes")
      .select("profile_id, created_datetime_utc");

    const firstSeen: Record<string, Date> = {};
    const processData = (items: { profile_id: string | null; created_datetime_utc: string | null }[] | null) => {
      items?.forEach(d => {
        if (!d.profile_id || !d.created_datetime_utc) return;
        const date = new Date(d.created_datetime_utc);
        if (!firstSeen[d.profile_id] || date < firstSeen[d.profile_id]) {
          firstSeen[d.profile_id] = date;
        }
      });
    };

    processData(captionData as any);
    processData(voteData as any);

    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    
    let count = 0;
    Object.values(firstSeen).forEach(date => {
      if (date >= threeMonthsAgo) {
        count++;
      }
    });

    return count.toString();
  } catch (error) {
    console.error("Unexpected error in getNewUsersLastThreeMonths:", error);
    return "0";
  }
}

/**
 * Total Votes Past 3 Weeks
 * - Returns array of vote counts for each of the last 3 weeks [current_week, week_2, week_3]
 */
export async function getVotesPastThreeWeeks() {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);

    const fetchRange = async (start: Date, end: Date) => {
      const { count, error } = await supabase
        .from("caption_votes")
        .select("*", { count: "exact", head: true })
        .gte("created_datetime_utc", start.toISOString())
        .lt("created_datetime_utc", end.toISOString());
      if (error) throw error;
      return count || 0;
    };

    const currentWeek = await fetchRange(oneWeekAgo, now);
    const week2 = await fetchRange(twoWeeksAgo, oneWeekAgo);
    const week3 = await fetchRange(threeWeeksAgo, twoWeeksAgo);

    return [currentWeek, week2, week3];
  } catch (error) {
    console.error("Unexpected error in getVotesPastThreeWeeks:", error);
    return [0, 0, 0];
  }
}
