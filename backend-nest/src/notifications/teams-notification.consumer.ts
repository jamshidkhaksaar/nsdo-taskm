import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
// import { InjectRedis } from '@liaoliaots/nestjs-redis'; // Assuming nestjs-redis integration later
import Redis from 'ioredis';
import axios from 'axios'; // For sending requests to Teams
import { ConfigService } from '@nestjs/config';
import { REDIS_SUBSCRIBER } from './notifications.module'; // Import token

@Injectable()
export class TeamsNotificationConsumer implements OnModuleInit {
  private readonly logger = new Logger(TeamsNotificationConsumer.name);

  constructor(
    @Inject(REDIS_SUBSCRIBER) private readonly redisSubscriber: Redis,
    private readonly configService: ConfigService // ConfigService needed for Teams URL
  ) {}

  onModuleInit() {
    this.subscribeToNotifications(); // Uncomment subscribe call
    this.logger.log('Teams Notification Consumer Initialized and Subscribing');
  }

  private subscribeToNotifications() {
    const channel = 'notifications:new';
    this.redisSubscriber.subscribe(channel, (err, count) => {
       if (err) {
        this.logger.error(`Failed to subscribe to Redis channel ${channel}`, err);
        return;
      }
      this.logger.log(`Subscribed to Redis channel ${channel} (${count} total subscriptions).`);
    });

    this.redisSubscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        this.logger.log(`Received message from Redis channel ${receivedChannel} for Teams processing`);
        try {
            this.handleNotification(JSON.parse(message));
          } catch (parseError) {
            this.logger.error(`Failed to parse message from Redis: ${parseError}`, message);
          }
      }
    });
  }

  private async handleNotification(notification: any): Promise<void> {
    this.logger.log('Processing notification for Teams:', notification);
    const teamsWebhookUrl = this.configService.get<string>('TEAMS_WEBHOOK_URL'); // Read from config
    
    if (!teamsWebhookUrl) {
      this.logger.error('Teams Webhook URL (TEAMS_WEBHOOK_URL) not configured in environment variables.');
      return;
    }

    // Format notification into Teams message (Adaptive Card example)
    const teamsMessage = {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          contentUrl: null,
          content: {
            type: 'AdaptiveCard',
            body: [
              {
                type: 'TextBlock',
                size: 'Medium',
                weight: 'Bolder',
                text: `Notification: ${notification.type || 'General'}`
              },
              {
                type: 'TextBlock',
                text: notification.message || 'No message content provided.',
                wrap: true
              }
            ],
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            version: '1.0'
          }
        }
      ]
    };

    try {
      await axios.post(teamsWebhookUrl, teamsMessage);
      this.logger.log('Notification sent to Teams successfully.');
    } catch (error) {
      const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
      this.logger.error(`Failed to send notification to Teams: ${errorMessage}`, error.stack);
    }
  }
} 