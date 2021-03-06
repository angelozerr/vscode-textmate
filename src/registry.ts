/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import { createGrammar, Grammar, collectIncludedScopes, IGrammarRepository, IScopeNameSet } from './grammar';
import { IRawGrammar } from './types';
import { IGrammar, IEmbeddedLanguagesMap } from './main';
import { Theme, ThemeTrieElementRule } from './theme';

export class SyncRegistry implements IGrammarRepository {

	private readonly _grammars: { [scopeName: string]: Grammar; };
	private readonly _rawGrammars: { [scopeName: string]: IRawGrammar; };
	private readonly _injectionGrammars: { [scopeName: string]: string[]; };
	private _theme: Theme;

	constructor(theme: Theme) {
		this._theme = theme;
		this._grammars = {};
		this._rawGrammars = {};
		this._injectionGrammars = {};
	}

	public setTheme(theme: Theme): void {
		this._theme = theme;
		Object.keys(this._grammars).forEach((scopeName) => {
			let grammar = this._grammars[scopeName];
			grammar.onDidChangeTheme();
		});
	}

	public getColorMap(): string[] {
		return this._theme.getColorMap();
	}

	/**
	 * Add `grammar` to registry and return a list of referenced scope names
	 */
	public addGrammar(grammar: IRawGrammar, injectionScopeNames?: string[]): string[] {
		this._rawGrammars[grammar.scopeName] = grammar;

		let includedScopes: IScopeNameSet = {};
		collectIncludedScopes(includedScopes, grammar);

		if (injectionScopeNames) {
			this._injectionGrammars[grammar.scopeName] = injectionScopeNames;
			injectionScopeNames.forEach(scopeName => {
				includedScopes[scopeName] = true;
			});
		}
		return Object.keys(includedScopes);
	}

	/**
	 * Lookup a raw grammar.
	 */
	public lookup(scopeName: string): IRawGrammar {
		return this._rawGrammars[scopeName];
	}

	/**
	 * Returns the injections for the given grammar
	 */
	public injections(targetScope: string): string[] {
		return this._injectionGrammars[targetScope];
	}

	/**
	 * Get the default theme settings
	 */
	public getDefaults(): ThemeTrieElementRule {
		return this._theme.getDefaults();
	}

	/**
	 * Match a scope in the theme.
	 */
	public themeMatch(scopeName: string): ThemeTrieElementRule[] {
		return this._theme.match(scopeName);
	}


	/**
	 * Lookup a grammar.
	 */
	public grammarForScopeName(scopeName: string, initialLanguage: number, embeddedLanguages: IEmbeddedLanguagesMap): IGrammar {
		if (!this._grammars[scopeName]) {
			let rawGrammar = this._rawGrammars[scopeName];
			if (!rawGrammar) {
				return null;
			}

			this._grammars[scopeName] = createGrammar(rawGrammar, initialLanguage, embeddedLanguages, this);
		}
		return this._grammars[scopeName];
	}
}
