import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { AxiosError } from "axios";
import { firstValueFrom } from "rxjs";

@Injectable()
export class TeamsNotificationService implements OnModuleInit {
  private readonly logger = new Logger(TeamsNotificationService.name);
  private readonly teamsWebhookUrl: string | undefined;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.teamsWebhookUrl = this.configService.get<string>("TEAMS_WEBHOOK_URL");
  }

  async onModuleInit() {
    // Temporarily disable Redis subscription logic
    this.logger.warn(
      "Redis subscription logic in TeamsNotificationService is temporarily disabled.",
    );
    return;
    /* Original logic:
    if (!this.teamsWebhookUrl) {
      this.logger.warn(
        'TEAMS_WEBHOOK_URL is not configured. Teams notifications will be disabled. Service will not subscribe to Redis.'
      );
      return;
    }

    this.logger.log(
      'Initializing TeamsNotificationService and subscribing to Redis...',
    );
    const subscriber = this.redisSubscriber;

    if (subscriber.listenerCount('message') === 0) {
      await subscriber.subscribe('notifications:new', (err, count) => {
        if (err) {
          this.logger.error(
            'Failed to subscribe to Redis channel for Teams notifications',
            err,
          );
          return;
        }
        this.logger.log(
          `Subscribed successfully to Redis for Teams notifications! This client is currently subscribed to ${count} channels.`,
        );
      });

      subscriber.on('message', (channel, message) => {
        if (channel === 'notifications:new') {
          this.logger.log(`Received notification for Teams processing: ${message}`);
          this.processAndSendNotification(message);
        }
      });
    } else {
      this.logger.log('Already subscribed to Redis messages.');
    }
    */
  }

  private async processAndSendNotification(message: string): Promise<void> {
    if (!this.teamsWebhookUrl) {
      this.logger.warn(
        "Attempted to send Teams notification, but webhook URL is not configured.",
      );
      return;
    }

    try {
      const notification = JSON.parse(message);
      const { title, body, priority, url, actorName } =
        notification.payload || {};

      const teamsMessage = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        themeColor: priority === "high" ? "FF0000" : "0076D7",
        summary: title || "New Notification",
        sections: [
          {
            activityTitle: title || "Notification",
            activitySubtitle: `From: ${actorName || "System"}`,
            text: body || "You have a new notification.",
            facts: [],
            markdown: true,
          },
        ],
        potentialAction: url
          ? [
              {
                "@type": "OpenUri",
                name: "View Details",
                targets: [{ os: "default", uri: url }],
              },
            ]
          : [],
      };

      this.logger.log(
        `Sending message to Teams: ${JSON.stringify(teamsMessage)}`,
      );

      await firstValueFrom(
        this.httpService.post(this.teamsWebhookUrl, teamsMessage, {
          headers: { "Content-Type": "application/json" },
        }),
      );

      this.logger.log("Successfully sent notification to Teams.");
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error(
          `Error sending notification to Teams: ${error.response?.status} ${error.response?.statusText}`,
          error.response?.data || error.message,
        );
      } else if (error instanceof SyntaxError) {
        this.logger.error(
          "Error parsing notification message from Redis:",
          error.message,
        );
      } else {
        this.logger.error(
          "Unexpected error processing Teams notification:",
          error,
        );
      }
    }
  }
}
