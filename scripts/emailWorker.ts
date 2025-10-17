import 'dotenv/config';
import { createKafkaConsumer, EMAIL_INVITE_TOPIC } from '@/lib/kafka';
import { sendInviteEmail } from '@/lib/email';

type InviteEmailMessage = {
  recipientEmail: string;
  recipientName: string;
  trip: any;
  participantId: string;
};

async function main() {
  const consumer = await createKafkaConsumer('email-worker');
  await consumer.subscribe({ topic: EMAIL_INVITE_TOPIC, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      try {
        const payload = JSON.parse(message.value.toString()) as InviteEmailMessage;
        await sendInviteEmail(
          payload.recipientEmail,
          payload.recipientName,
          payload.trip,
          payload.participantId
        );
      } catch (err) {
        console.error('emailWorker: failed to process message', err);
        // Let Kafka retry by not committing offsets manually (kafkajs auto-commits after processing)
        // In a more advanced setup, we would use DLQ with another topic
      }
    },
  });
}

main().catch((err) => {
  console.error('emailWorker: fatal error', err);
  process.exit(1);
});


