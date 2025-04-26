import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import axios from 'axios';
import { REDIS_SUBSCRIBER } from '../notifications.module';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TeamsNotificationConsumer implements OnModuleInit {
  private readonly logger = new Logger(TeamsNotificationConsumer.name);
  private redisSubscriber: Redis;

  constructor(
    @Inject(REDIS_SUBSCRIBER) private readonly injectedRedisSubscriber: Redis,
    private readonly configService: ConfigService,
  ) {
    // Use a separate subscriber instance or the shared one? 
    // Using the shared one for now, assuming it's okay for this load.
    this.redisSubscriber = this.injectedRedisSubscriber;
  }

  onModuleInit() {
    // Check if Teams integration is enabled via config
    const teamsWebhookUrl = this.configService.get<string>('TEAMS_WEBHOOK_URL');
    if (!teamsWebhookUrl) {
      this.logger.warn('TEAMS_WEBHOOK_URL not configured. Teams notifications disabled.');
      return; // Don't subscribe if URL is missing
    }

    this.logger.log('Initializing Redis subscription for Teams...');
    // Assuming we use the SAME subscriber client instance injected into the module
    // If it wasn't subscribed already by the Gateway, we would subscribe here.
    // We just need to ensure the message handler is attached.
    
    this.redisSubscriber.on('message', (channel, message) => {
        if (channel === 'notifications:new') { // Ensure handling the correct channel
            this.handleRedisMessage(message);
        }
    });
    
    // Check if the subscriber is already connected and listening
    if (this.redisSubscriber.status === 'ready') {
        this.logger.log('Redis subscriber already connected. Listening for Teams notifications...');
    } else {
        this.logger.warn('Redis subscriber not yet connected when TeamsConsumer initialized.');
        // The listener is attached, it will process messages once connected.
    }
  }

  private async handleRedisMessage(message: string) {
    const teamsWebhookUrl = this.configService.get<string>('TEAMS_WEBHOOK_URL');
    if (!teamsWebhookUrl) return; // Double check in case config changes

    this.logger.log('Received notification message for Teams processing');
    try {
      const notificationPayload = JSON.parse(message);
      
      // Format the message for Teams (e.g., Adaptive Card)
      const teamsCard = this.formatForTeams(notificationPayload);

      // Send to Teams Webhook
      await axios.post(teamsWebhookUrl, teamsCard, {
        headers: { 'Content-Type': 'application/vnd.microsoft.card.adaptive' }
      });

      this.logger.log(`Sent notification ${notificationPayload.id} to Teams.`);

    } catch (error) {
      const errorMessage = error.response?.data || error.message;
      this.logger.error(`Failed to process or send notification to Teams: ${errorMessage}`, error.stack);
    }
  }

  private formatForTeams(payload: any): any {
    // Simple example: Create a basic Adaptive Card JSON
    // Customize this based on notification type and payload content
    this.logger.log(`Formatting notification ${payload.id} for Teams.`);
    
    let relatedInfo = '';
    if (payload.relatedEntityType && payload.relatedEntityId) {
      relatedInfo = `\n\n**Related:** ${payload.relatedEntityType} ID: ${payload.relatedEntityId}`;
    }

    // Basic Adaptive Card structure
    return {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            type: 'AdaptiveCard',
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            version: '1.4',
            body: [
              {
                type: 'TextBlock',
                text: `Notification: ${payload.type || 'General'}`,
                weight: 'Bolder',
                size: 'Medium'
              },
              {
                type: 'TextBlock',
                text: payload.message,
                wrap: true
              },
              {
                type: 'TextBlock',
                text: `_User ID: ${payload.userId}_${relatedInfo}`,
                wrap: true,
                size: 'Small',
                isSubtle: true
              },
              {
                type: 'TextBlock',
                text: `_Received: ${new Date(payload.createdAt).toLocaleString()}_`,
                wrap: true,
                size: 'Small',
                isSubtle: true,
                spacing: 'None'
              }
            ]
            // Potentially add actions here later
            // actions: [
            //   {
            //     type: 'Action.OpenUrl',
            //     title: 'View Details',
            //     url: 'YOUR_APP_URL/details/...' // Construct a relevant link
            //   }
            // ]
          }
        }
      ]
    };
  }
} 