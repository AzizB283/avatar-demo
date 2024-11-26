import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
  });

  const assistantId: any = process.env.NEXT_PUBLIC_ASSISTANT_ID;

  const { message, threadId }: any = await req.json();

  if (!message || !threadId) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  try {
    const threadMessages = await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });

    let run = await openai.beta.threads.runs.createAndPoll(threadId, {
      assistant_id: assistantId,
    });

    if (run.status === "completed") {
      const messages = await openai.beta.threads.messages.list(run.thread_id);

      return NextResponse.json(messages.data[0].content[0]);
      //   for (const message of messages.data.reverse()) {
      //     console.log(`${message.role} > ${message.content[0].text.value}`);
      //   }
    } else {
      console.log(run.status);
      return NextResponse.json({ status: run.status });
    }

    // const stream = await openai.beta.threads.runs.stream(threadId, {
    //   assistant_id: assistantId,
    // });

    // return new Response(stream.toReadableStream());
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
