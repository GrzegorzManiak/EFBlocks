import {VariableStore} from "./executer/variable";

type Page = {
    name: string;
    serialised: string;
    code: string[];
};

type Project = {
    id: string;
    currentPage: string;
    pages: Array<Page>;
    variableStore: VariableStore;
}

function SerializeProject(project: Project): string {
    return JSON.stringify({
        id: project.id,
        currentPage: project.currentPage,
        pages: project.pages,
        variableStore: project.variableStore.serialize(),
    });
}

function DeserializeProject(serialised: string): Project {
    const data = JSON.parse(serialised);
    return {
        id: data.id,
        currentPage: data.currentPage,
        pages: data.pages,
        variableStore: VariableStore.deserialize(data.variableStore),
    };
}

export {
    type Page,
    type Project,

    SerializeProject,
    DeserializeProject,
}