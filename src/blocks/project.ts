import {VariableStore} from "./executer/variable";

type Page = {
    name: string;
    serialised: string;
    code: string[];
};

type Project = {
    id: string;
    name: string;
    currentPage: string;
    pages: Array<Page>;
    variableStore: VariableStore;
    lastModified: string;
}

function SerializeProject(project: Project): string {
    return JSON.stringify(project);
}

function DeserializeProject(serialised: string): Project {
    const data = JSON.parse(serialised);
    return {
        id: data.id,
        lastModified: data.lastModified,
        name: data.name,
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