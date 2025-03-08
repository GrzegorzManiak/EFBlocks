import * as BlockRenderer from "./renderer";
import {randomId} from "./helpers";
import {InputMode, InputType} from "./renderer/types";

const colors = {
	FlowControl: '#FFFFAA',
	Loops: '#8be0ff',
	Variable: '#8bffb9',
	Message: '#ffc396',

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
	name: 'foreverLoop',
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
					internalName: 'from',
					id: randomId(),
					name: 'Variable',
					type: InputType.Variable,
					mode: InputMode.Read
				},
				{
					internalName: 'to',
					id: randomId(),
					name: 'Value',
					type: InputType.Variable,
					mode: InputMode.Write
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

const DefaultBlocks = [
	startAgent,
	endAgent,
	broadCast,
	// onMessage,
	// setVariableTo,
	// whileLoop,
	// foreverLoop,
	// ifElifBlock,
	// ifBlock,
];

export default DefaultBlocks;

export {
	DefaultBlocks,
}