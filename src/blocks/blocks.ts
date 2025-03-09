import * as BlockRenderer from "./renderer";
import {randomId} from "./helpers";
import {InputMode, InputType} from "./renderer/types";

const colors = {
	FlowControl: '#FFFFAA',
	Loops: '#8be0ff',
	Variable: '#8bffb9',
	Message: '#ffc396',

	Action: '#d48bff',

	Start: '#CBFF8B',
	End: '#FF8B8B',
}

const startAgent: BlockRenderer.Types.BlockDefinition = {
	name: 'startAgent',
	isEntry: true,
	configuration: {
		color: colors.Start,
		forceScope: true
	},
	segments: [
		{
			name: 'startAgent',
			id: randomId(),
			text: 'Agent Initiated',
			type: BlockRenderer.Types.BlockSegment.Header,
			notch: true,
		}
	]
};

const endAgent: BlockRenderer.Types.BlockDefinition = {
	name: 'endAgent',
	configuration: {
		color: colors.End
	},
	segments: [
		{
			name: 'endAgent',
			id: randomId(),
			text: 'Agent Terminated',
			type: BlockRenderer.Types.BlockSegment.Header,
			divot: true,
		}
	]
}

const ifBlock: BlockRenderer.Types.BlockDefinition = {
	name: 'ifFunc',
	configuration: {
		color: colors.FlowControl,
	},
	segments: [
		{
			name: 'if',
			id: randomId(),
			text: 'If',
			type: BlockRenderer.Types.BlockSegment.Header,
			notch: true,
			divot: true,
			inputs: [
				{
					internalName: 'varA',
					id: randomId(),
					name: 'Variable A',
					type: InputType.Variable,
					mode: InputMode.Read
				},
				{
					internalName: 'eval',
					id: randomId(),
					name: 'Eval',
					type: InputType.EvalOperator,
					mode: InputMode.Read
				},
				{
					internalName: 'varB',
					id: randomId(),
					name: 'Variable B',
					type: InputType.Variable,
					mode: InputMode.Read
				}
			]
		},
		{
			name: 'if-footer',
			id: randomId(),
			type: BlockRenderer.Types.BlockSegment.Footer,
			notch: true
		},
	]
};

const ifElifBlock: BlockRenderer.Types.BlockDefinition = {
	name: 'ifElse',
	configuration: {
		color: colors.FlowControl,
	},
	segments: [
		{
			name: 'if',
			id: randomId(),
			text: 'If',
			type: BlockRenderer.Types.BlockSegment.Header,
			notch: true,
			divot: true,
			inputs: [
				{
					internalName: 'varA',
					id: randomId(),
					name: 'Variable A',
					type: InputType.Variable,
					mode: InputMode.Read
				},
				{
					internalName: 'eval',
					id: randomId(),
					name: 'Eval',
					type: InputType.EvalOperator,
					mode: InputMode.Read
				},
				{
					internalName: 'varB',
					id: randomId(),
					name: 'Variable B',
					type: InputType.Variable,
					mode: InputMode.Read
				}
			]
		},
		{
			name: 'elif',
			id: randomId(),
			text: 'Else If',
			type: BlockRenderer.Types.BlockSegment.Divider,
			notch: true,
			inputs: [
				{
					internalName: 'varA',
					id: randomId(),
					name: 'Variable A',
					type: InputType.Variable,
					mode: InputMode.Read
				},
				{
					internalName: 'eval',
					id: randomId(),
					name: 'Eval',
					type: InputType.EvalOperator,
					mode: InputMode.Read
				},
				{
					internalName: 'varB',
					id: randomId(),
					name: 'Variable B',
					type: InputType.Variable,
					mode: InputMode.Read
				}
			]
		},
		{
			name: 'if-footer',
			id: randomId(),
			type: BlockRenderer.Types.BlockSegment.Footer,
			notch: true
		},
	]
};

const whileLoop: BlockRenderer.Types.BlockDefinition = {
	name: 'whileLoop',
	configuration: {
		color: colors.Loops
	},
	segments: [
		{
			name: 'while',
			id: randomId(),
			text: 'While',
			type: BlockRenderer.Types.BlockSegment.Header,
			notch: true,
			divot: true,
			inputs: [
				{
					internalName: 'varA',
					id: randomId(),
					name: 'Variable A',
					type: InputType.Variable,
					mode: InputMode.Read
				},
				{
					internalName: 'eval',
					id: randomId(),
					name: 'Eval',
					type: InputType.EvalOperator,
					mode: InputMode.Read
				},
				{
					internalName: 'varB',
					id: randomId(),
					name: 'Variable B',
					type: InputType.Variable,
					mode: InputMode.Read
				}
			]
		},
		{
			name: 'while-footer',
			id: randomId(),
			type: BlockRenderer.Types.BlockSegment.Footer,
			notch: true
		}
	]
}

const foreverLoop: BlockRenderer.Types.BlockDefinition = {
	name: 'forever',
	configuration: {
		color: colors.Loops
	},
	segments: [
		{
			name: 'forever',
			id: randomId(),
			text: 'Forever',
			type: BlockRenderer.Types.BlockSegment.Header,
			notch: true,
			divot: true
		},
		{
			name: 'forever-footer',
			id: randomId(),
			type: BlockRenderer.Types.BlockSegment.Footer,
		}
	]
}

const setVariableTo: BlockRenderer.Types.BlockDefinition = {
	name: 'setVariableTo',
	configuration: {
		color: colors.Variable
	},
	segments: [
		{
			name: 'setVariableTo',
			id: randomId(),
			text: 'Set Variable',
			type: BlockRenderer.Types.BlockSegment.Header,
			notch: true,
			divot: true,
			inputs: [
				{
					internalName: 'data',
					id: randomId(),
					name: 'Data',
					type: InputType.Variable,
					mode: InputMode.Read
				},
				{
					internalName: 'variable',
					id: randomId(),
					name: 'Variable',
					type: InputType.Variable,
					mode: InputMode.Write
				}
			]
		}
	]
}

const logVariable: BlockRenderer.Types.BlockDefinition = {
	name: 'logVariable',
	configuration: {
		color: colors.Variable
	},
	segments: [
		{
			name: 'logVariable',
			id: randomId(),
			text: 'Log Variable',
			type: BlockRenderer.Types.BlockSegment.Header,
			notch: true,
			divot: true,
			inputs: [
				{
					internalName: 'var',
					id: randomId(),
					name: 'Variable',
					type: InputType.Variable,
					mode: InputMode.Read
				}
			]
		}
	]
}

const broadCast: BlockRenderer.Types.BlockDefinition = {
	name: 'broadCast',
	configuration: {
		color: colors.Message
	},
	segments: [
		{
			name: 'broadCast',
			id: randomId(),
			text: 'Broadcast',
			type: BlockRenderer.Types.BlockSegment.Header,
			notch: true,
			divot: true,
			inputs: [
				{
					internalName: 'chanel',
					id: randomId(),
					name: 'Message',
					type: InputType.Variable,
					mode: InputMode.Read
				}
			]
		}
	]
}

const onMessage: BlockRenderer.Types.BlockDefinition = {
	name: 'onMessage',
	isEntry: true,
	configuration: {
		color: colors.Message,
		forceScope: true
	},
	segments: [
		{
			name: 'onMessage',
			id: randomId(),
			text: 'On Message',
			type: BlockRenderer.Types.BlockSegment.Header,
			notch: true,
			inputs: [
				{
					internalName: 'chanel',
					id: randomId(),
					name: 'Message',
					type: InputType.Variable,
					mode: InputMode.Read
				}
			]
		}
	]
}

const sendEmail: BlockRenderer.Types.BlockDefinition = {
	name: 'sendEmail',
	isAsync: true,
	configuration: {
		color: colors.Action
	},
	segments: [
		{
			name: 'sendEmail',
			id: randomId(),
			text: 'Send Email',
			type: BlockRenderer.Types.BlockSegment.Header,
			notch: true,
			divot: true,
			inputs: [
				{
					internalName: 'email',
					id: randomId(),
					name: 'Email',
					type: InputType.Variable,
					mode: InputMode.Read
				},
				{
					internalName: 'message',
					id: randomId(),
					name: 'Message',
					type: InputType.Variable,
					mode: InputMode.Read
				},
				{
					internalName: 'subject',
					id: randomId(),
					name: 'Subject',
					type: InputType.Variable,
					mode: InputMode.Read
				}
			]
		}
	]
}

const sendSms: BlockRenderer.Types.BlockDefinition = {
	name: 'sendSms',
	isAsync: true,
	configuration: {
		color: colors.Action
	},
	segments: [
		{
			name: 'sendSms',
			id: randomId(),
			text: 'Send SMS',
			type: BlockRenderer.Types.BlockSegment.Header,
			notch: true,
			divot: true,
			inputs: [
				{
					internalName: 'phone',
					id: randomId(),
					name: 'Phone',
					type: InputType.Variable,
					mode: InputMode.Read
				},
				{
					internalName: 'message',
					id: randomId(),
					name: 'Message',
					type: InputType.Variable,
					mode: InputMode.Read
				}
			]
		}
	]
}

const sendLocalText: BlockRenderer.Types.BlockDefinition = {
	name: 'sendLocalText',
	isAsync: true,
	configuration: {
		color: colors.Action
	},
	segments: [
		{
			name: 'sendSms',
			id: randomId(),
			text: 'Send Local Text',
			type: BlockRenderer.Types.BlockSegment.Header,
			notch: true,
			divot: true,
			inputs: [
				{
					internalName: 'message',
					id: randomId(),
					name: 'Message',
					type: InputType.Variable,
					mode: InputMode.Read
				}
			]
		}
	]
}

const waitForLocalText: BlockRenderer.Types.BlockDefinition = {
	name: 'waitForLocalText',
	isAsync: true,
	configuration: {
		color: colors.Action
	},
	segments: [
		{
			name: 'waitForLocalText',
			id: randomId(),
			text: 'Wait For Local Text',
			type: BlockRenderer.Types.BlockSegment.Header,
			notch: true,
			divot: true,
			inputs: [
				{
					internalName: 'output',
					id: randomId(),
					name: 'Output',
					type: InputType.Variable,
					mode: InputMode.Write
				}
			]
		}
	]
}

const sendWhatsapp: BlockRenderer.Types.BlockDefinition = {
	name: 'sendWhatsapp',
	isAsync: true,
	configuration: {
		color: colors.Action
	},
	segments: [
		{
			name: 'sendWhatsapp',
			id: randomId(),
			text: 'Send Whatsapp',
			type: BlockRenderer.Types.BlockSegment.Header,
			notch: true,
			divot: true,
			inputs: [
				{
					internalName: 'phone',
					id: randomId(),
					name: 'Phone',
					type: InputType.Variable,
					mode: InputMode.Read
				},
				{
					internalName: 'message',
					id: randomId(),
					name: 'Message',
					type: InputType.Variable,
					mode: InputMode.Read
				}
			]
		}
	]
}

const prompt: BlockRenderer.Types.BlockDefinition = {
	name: 'prompt',
	isAsync: true,
	configuration: {
		color: colors.Action
	},
	segments: [
		{
			name: 'prompt',
			id: randomId(),
			text: 'Prompt',
			type: BlockRenderer.Types.BlockSegment.Header,
			notch: true,
			divot: true,
			inputs: [
				{
					internalName: 'message',
					id: randomId(),
					name: 'Message',
					type: InputType.Variable,
					mode: InputMode.Read
				},
				{
					internalName: 'variable',
					id: randomId(),
					name: 'Output',
					type: InputType.Variable,
					mode: InputMode.Write
				}
			]
		}
	]
}

const promptOn: BlockRenderer.Types.BlockDefinition = {
	name: 'promptOn',
	isAsync: true,
	configuration: {
		color: colors.Action
	},
	segments: [
		{
			name: 'promptOn',
			id: randomId(),
			text: 'Prompt On',
			type: BlockRenderer.Types.BlockSegment.Header,
			notch: true,
			divot: true,
			inputs: [
				{
					internalName: 'message',
					id: randomId(),
					name: 'Message',
					type: InputType.Variable,
					mode: InputMode.Read
				},
				{
					internalName: 'variable',
					id: randomId(),
					name: 'Output',
					type: InputType.Variable,
					mode: InputMode.Write
				},
				{
					internalName: 'on',
					id: randomId(),
					name: 'On',
					type: InputType.Variable,
					mode: InputMode.Read
				}
			]
		}
	]
}

const aiIfFunc: BlockRenderer.Types.BlockDefinition = {
	name: 'aiIfFunc',
	configuration: {
		color: colors.Action,
	},
	segments: [
		{
			name: 'aiif',
			id: randomId(),
			text: 'AI If',
			type: BlockRenderer.Types.BlockSegment.Header,
			notch: true,
			divot: true,
			inputs: [
				{
					internalName: 'varA',
					id: randomId(),
					name: 'Variable A',
					type: InputType.Variable,
					mode: InputMode.Read
				},
				{
					internalName: 'eval',
					id: randomId(),
					name: 'Eval',
					type: InputType.EvalOperator,
					mode: InputMode.Read
				},
				{
					internalName: 'varB',
					id: randomId(),
					name: 'Variable B',
					type: InputType.Variable,
					mode: InputMode.Read
				}
			]
		},
		{
			name: 'if-footer',
			id: randomId(),
			type: BlockRenderer.Types.BlockSegment.Footer,
			notch: true
		},
	]
};

const textToSpeech: BlockRenderer.Types.BlockDefinition = {
	name: 'generateVoice',
	isAsync: true,
	configuration: {
		color: colors.Action
	},
	segments: [
		{
			name: 'tts',
			id: randomId(),
			text: 'Text to Speech',
			type: BlockRenderer.Types.BlockSegment.Header,
			notch: true,
			divot: true,
			inputs: [
				{
					internalName: 'text',
					id: randomId(),
					name: 'Text',
					type: InputType.Variable,
					mode: InputMode.Read
				},
				{
					internalName: 'outputPath',
					id: randomId(),
					name: 'Output Path',
					type: InputType.Variable,
					mode: InputMode.Write
				}
			]
		}
	]
}

const sendWhatsappVoiceMessage: BlockRenderer.Types.BlockDefinition = {
	name: 'sendWhatsappVoiceMessage',
	isAsync: true,
	configuration: {
		color: colors.Action
	},
	segments: [
		{
			name: 'tts',
			id: randomId(),
			text: 'Send Whatsapp Voice Message',
			type: BlockRenderer.Types.BlockSegment.Header,
			notch: true,
			divot: true,
			inputs: [
				{
					internalName: 'phone',
					id: randomId(),
					name: 'Phone Number',
					type: InputType.Variable,
					mode: InputMode.Read
				},
				{
					internalName: 'audioPath',
					id: randomId(),
					name: 'Audio Path',
					type: InputType.Variable,
					mode: InputMode.Read
				}
			]
		}
	]
}

const DefaultBlocks = [
	startAgent,
	endAgent,
	broadCast,
	onMessage,
	setVariableTo,
	logVariable,
	whileLoop,
	foreverLoop,
	ifElifBlock,
	ifBlock,
	sendEmail,
	sendSms,
	sendLocalText,
	waitForLocalText,
	sendWhatsapp,
	prompt,
	promptOn,
	aiIfFunc,
	textToSpeech,
	sendWhatsappVoiceMessage
];

export default DefaultBlocks;

export {
	DefaultBlocks,
}