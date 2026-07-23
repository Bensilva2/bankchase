import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "bankchase" });

// Event types
export type Events = 
  | {
      name: "transaction/processed";
      data: {
        transactionId: string;
        userId: string;
        amount: number;
        status: "completed" | "failed";
        timestamp: string;
      };
    }
  | {
      name: "user/signup";
      data: {
        userId: string;
        email: string;
        name: string;
      };
    }
  | {
      name: "notification/send";
      data: {
        userId: string;
        type: "alert" | "promotion" | "security" | "reminder";
        title: string;
        message: string;
        channels: ("email" | "push" | "sms")[];
      };
    }
  | {
      name: "webhook/request.received";
      data: Record<string, any>;
    };
