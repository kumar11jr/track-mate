import { Kafka, logLevel, Producer, Consumer } from 'kafkajs';

let kafkaSingleton: Kafka | null = null;
let producerSingleton: Producer | null = null;

function getKafka(): Kafka {
  if (!kafkaSingleton) {
    const brokersEnv = process.env.KAFKA_BROKERS || 'localhost:9092';
    const brokers = brokersEnv.split(',').map(b => b.trim()).filter(Boolean);
    kafkaSingleton = new Kafka({
      clientId: 'trackmate-app',
      brokers,
      logLevel: logLevel.NOTHING,
    });
  }
  return kafkaSingleton;
}

export async function getKafkaProducer(): Promise<Producer> {
  if (!producerSingleton) {
    const kafka = getKafka();
    producerSingleton = kafka.producer();
    await producerSingleton.connect();
  }
  return producerSingleton;
}

export async function createKafkaConsumer(groupId: string): Promise<Consumer> {
  const kafka = getKafka();
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  return consumer;
}

export const EMAIL_INVITE_TOPIC = 'email.invite.v1';


