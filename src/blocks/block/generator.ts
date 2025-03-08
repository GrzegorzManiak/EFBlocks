import Block from "./block";
import {type SegmentAuxMap, SnapPointType} from "../renderer/types";
import blocks from "../blocks";
import beautify from 'js-beautify';

// Helper: Convert a block’s variables (SegmentAuxMap) into a string literal
function generateInputObject(variables: SegmentAuxMap): string {
	// If there are no variables, return an empty object
	if (!variables || variables.size === 0) {
		return "{}";
	}

	const segmentMap: any = {};
	for (const [segmentId, inputData] of variables.entries()) {
		if (!inputData.inputs || inputData.inputs.inputs.length === 0) continue;
		segmentMap[segmentId] = inputData.inputs.inputs.map(input => {
			return {
				id: input.id,
				type: input.type,
				name: input.name,
				mode: input.mode,
				internalName: input.internalName,
				key: input.key || null,
				segmentName: inputData.inputs?.segmentName
			};
		});
	}

	if (Object.keys(segmentMap).length === 0) {
		return "";
	}

	return "{ " + Object.keys(segmentMap).map(key => {
		return `"${key}": ${JSON.stringify(segmentMap[key])}`;
	}).join(", ") + " }";
}

// Generate the code for a single block as a STD function call.
// It prefixes the call with STD. followed by the block's name,
// outputs the input object (if any),
// and wraps any secondary branches in an anonymous function.
function generateBlockCall(block: Block, indent: string): string {
	let code = "";

	// Build the STD call with block name and inputs.
	const inputsStr = generateInputObject(block.variables);
	code += indent + "await STD." + block.name + "(" + inputsStr + "";

	// Process any secondary branches (e.g. for if/else, while, etc.):
	let secondaryBranchCodes: string[] = [];
	for (const snapPoint of block.snapPoints.values()) {
		if (snapPoint.type === SnapPointType.SecondaryNotch && snapPoint.next) {
			let code = "async () => {\n";
			code += generateScopes(snapPoint.next.block, indent + "    ");
			code += indent + "}";
			secondaryBranchCodes.push([`"${snapPoint.segmentId}"`, code].join(": "));
		}
	}

	if (secondaryBranchCodes.length > 0) {
		const joined = secondaryBranchCodes.join(", ");
		code += inputsStr.length > 0 ? `,\n${indent}${indent}` : "";
		code += `{\n${joined}\n}`;
	}

	code += ");\n";
	return code;
}

function generateForceScopeBlockCall(block: Block, indent: string): string {
	let code = "";
	const inputsStr = generateInputObject(block.variables);
	code += indent + "await STD." + block.name + "(";

	for (const snapPoint of block.snapPoints.values()) {
		if (snapPoint.type === SnapPointType.SecondaryNotch && snapPoint.next) {
			throw new Error("Force scope blocks cannot have secondary branches");
		}
	}

	code += inputsStr;

	if (block.primaryNotch && block.primaryNotch.next) {
		if (inputsStr.length > 0) {
			code += ", ";
		}

		code += "async () => {\n";
		code += generateScopes(block.primaryNotch.next.block, indent + "    ");
		code += indent + "}";
	}

	code += ");\n";
	return code;
}

// Main recursive function: generate the block call for this block
// then, if there is a primary chain, generate that too.
function generateScopes(block: Block, indent: string = "    "): string {
	if (block.blockDefinition?.configuration?.forceScope) {
		return generateForceScopeBlockCall(block, indent);
	}

	else {
		let code = generateBlockCall(block, indent);
		if (block.primaryNotch && block.primaryNotch.next) {
			code += generateScopes(block.primaryNotch.next.block, indent);
		}

		return code;
	}
}

function generateJs(startBlock: Block): string {
	const output = generateScopes(startBlock, "    ");
	return beautify(output, { indent_size: 4 });
}

export {
	generateJs
}