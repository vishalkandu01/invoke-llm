import OpenAI from "openai";
import {tavily} from "@tavily/core";

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

const openai = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});


async function main() {

    const messages = [
        { 
            role: "system", 
            content: `You are a smart personal assitant who answers the asked questions.
            You have access to following tools:
            1. seachWeb({query}: {query: string}) //Search the latest information and realtime data on the internet.` },
        {
            role: "user",
            // content: `iphone16 launch date`,
            content: `what is the current weather in Mumbai?`
        },
    ];

    while(true) {
        
        const response = await openai.chat.completions.create({
            model: "gemini-2.0-flash",
            temperature: 0,
            messages: messages,
            tools: [
                {
                    type: "function",
                    function: {
                        name: "webSearch",
                        description: "Search the latest information and realtime data on the internet",
                        parameters: {
                            type: "object",
                            properties: {
                                query: {
                                    type: 'string',
                                    description: "The search query to perform on."
                                },
                            },
                            required: ["query"]
                        },
                    }
                }
            ],
            tool_choice: 'auto',
        });

        const firstResponse = response.choices[0].message;
        messages.push(firstResponse);
        
        // console.log(JSON.stringify("First API Response (Tool Call):", firstResponse, null, 2));


        const toolCalls = response.choices[0].message.tool_calls;

        if(!toolCalls) {
            console.log(`Assistant: ${response.choices[0].message.content}`);
            break;
        }

        for(const tool of toolCalls) {
            console.log('tool:', tool);
            const functionName = tool.function.name;
            const functionParams = tool.function.arguments;

            if(functionName === 'webSearch') {
                const toolResult = await webSearch(JSON.parse(functionParams));
                // console.log('Tool result: ', toolResult);
                // return toolResult;
                messages.push({
                    tool_call_id: tool.id,
                    role: 'tool',
                    content: toolResult,
                })
            }
        }

    }


    //     const response2 = await openai.chat.completions.create({
    //     model: "gemini-2.0-flash",
    //     temperature: 0,
    //     messages: messages,
    //     // tools: [
    //     //     {
    //     //         type: "function",
    //     //         function: {
    //     //             name: "webSearch",
    //     //             description: "Search the latest information and realtime data on the internet",
    //     //             parameters: {
    //     //                 type: "object",
    //     //                 properties: {
    //     //                     query: {
    //     //                         type: 'string',
    //     //                         description: "The search query to perform on."
    //     //                     },
    //     //                 },
    //     //                 required: ["query"]
    //     //             },
    //     //         }
    //     //     }
    //     // ],
    //     // tool_choice: 'auto',
    // });

    // // messages.push({
    // //     tool_call_id: tool.id,
    // //     role: 'tool',
    // //     name: functionName,
    // //     content: toolResult,
    // // })

    // console.log("-----------------------------------------------------\nFinal Assistant Response:", response2.choices[0].message, null, 2);
}



main();



async function webSearch({query}) {
    // Here we will do tavily api call

    // console.log('Iphone was launched on 20 September 2024.');
    // return 'Iphone was launched on 20 September 2024.';

    console.log(`Performing web search for: "${query}"`);
    const response = await tvly.search(query);
    // console.log("Travily API Response:",response);
    return JSON.stringify(response);
}