/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { doWithAllMatches } from "@atomist/automation-client/tree/ast/astUtils";
import { TypeScriptES6FileParser } from "@atomist/automation-client/tree/ast/typescript/TypeScriptFileParser";
import {
    CodeTransform,
    doWithFiles,
    SoftwareDeliveryMachine,
    SoftwareDeliveryMachineConfiguration,
} from "@atomist/sdm";
import {
    createSoftwareDeliveryMachine,
    summarizeGoalsInGitHubStatus,
} from "@atomist/sdm-core";

export function machine(
    configuration: SoftwareDeliveryMachineConfiguration,
): SoftwareDeliveryMachine {

    const sdm = createSoftwareDeliveryMachine({
        name: "Blank Seed Software Delivery Machine",
        configuration,
    });

    summarizeGoalsInGitHubStatus(sdm);

    sdm.addCodeTransformCommand({
        name: "standardize test filenames",
        intent: "update test filenames",
        transform: RenameTests,
    });

    return sdm;
}

/**
 * CodeTransform that renames tests
 */
const RenameTests: CodeTransform = async project => {
    await doWithAllMatches(project, TypeScriptES6FileParser,
        "test/**/*.ts",
        "//ImportDeclaration//StringLiteral",
        m => {
            if (!m.$value.includes("/src")) {
                m.$value = m.$value.replace(/Test$/, ".test");
            }
        });
    return doWithFiles(project, "test/**/*.ts", async f =>
        f.setPath(f.path.replace(/Test\.ts$/, ".test.ts")));
};
