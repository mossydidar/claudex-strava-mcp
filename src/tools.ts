import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { stravaGet } from "./strava-client.js";

function textResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function errorResult(message: string) {
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true,
  };
}

export function registerTools(server: McpServer): void {
  server.tool(
    "get_athlete_profile",
    "Get the authenticated athlete's profile including name, location, and preferences",
    {},
    async () => {
      try {
        const athlete = await stravaGet("/athlete");
        return textResult(athlete);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  );

  server.tool(
    "get_athlete_stats",
    "Get athlete statistics including total distance, time, elevation for running, cycling, and swimming. Includes recent, year-to-date, and all-time totals.",
    {
      athlete_id: z
        .number()
        .describe(
          "The athlete's numeric ID. Get this from get_athlete_profile first."
        ),
    },
    async ({ athlete_id }) => {
      try {
        const stats = await stravaGet(`/athletes/${athlete_id}/stats`);
        return textResult(stats);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  );

  server.tool(
    "list_activities",
    "List the authenticated athlete's recent activities with pagination. Returns summary data for each activity including name, type, distance, time, and elevation.",
    {
      page: z.number().optional().describe("Page number (default: 1)"),
      per_page: z
        .number()
        .optional()
        .describe("Items per page, max 200 (default: 30)"),
      before: z
        .number()
        .optional()
        .describe("Filter activities before this Unix epoch timestamp"),
      after: z
        .number()
        .optional()
        .describe("Filter activities after this Unix epoch timestamp"),
    },
    async ({ page, per_page, before, after }) => {
      try {
        const activities = await stravaGet("/athlete/activities", {
          page,
          per_page,
          before,
          after,
        });
        return textResult(activities);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  );

  server.tool(
    "get_activity",
    "Get detailed information about a specific activity including splits, segment efforts, and all metrics. Use list_activities first to find activity IDs.",
    {
      activity_id: z.number().describe("The activity's numeric ID"),
      include_all_efforts: z
        .boolean()
        .optional()
        .describe("Include all segment efforts (default: false)"),
    },
    async ({ activity_id, include_all_efforts }) => {
      try {
        const activity = await stravaGet(`/activities/${activity_id}`, {
          include_all_efforts,
        });
        return textResult(activity);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  );

  server.tool(
    "get_activity_laps",
    "Get lap data for a specific activity. Each lap includes time, distance, pace, heart rate, and other metrics.",
    {
      activity_id: z.number().describe("The activity's numeric ID"),
    },
    async ({ activity_id }) => {
      try {
        const laps = await stravaGet(`/activities/${activity_id}/laps`);
        return textResult(laps);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  );

  server.tool(
    "get_activity_zones",
    "Get heart rate and power zone distribution for a specific activity. Shows time spent in each zone.",
    {
      activity_id: z.number().describe("The activity's numeric ID"),
    },
    async ({ activity_id }) => {
      try {
        const zones = await stravaGet(`/activities/${activity_id}/zones`);
        return textResult(zones);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  );

  server.tool(
    "list_routes",
    "List the athlete's saved routes. Returns summary data including name, distance, elevation gain, and type.",
    {
      athlete_id: z
        .number()
        .describe(
          "The athlete's numeric ID. Get this from get_athlete_profile first."
        ),
      page: z.number().optional().describe("Page number (default: 1)"),
      per_page: z
        .number()
        .optional()
        .describe("Items per page (default: 30)"),
    },
    async ({ athlete_id, page, per_page }) => {
      try {
        const routes = await stravaGet(`/athletes/${athlete_id}/routes`, {
          page,
          per_page,
        });
        return textResult(routes);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  );

  server.tool(
    "get_route",
    "Get detailed information about a specific route including distance, elevation profile, and waypoints.",
    {
      route_id: z.number().describe("The route's numeric ID"),
    },
    async ({ route_id }) => {
      try {
        const route = await stravaGet(`/routes/${route_id}`);
        return textResult(route);
      } catch (error) {
        return errorResult(
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  );
}
