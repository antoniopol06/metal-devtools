import Component, {Config} from 'metal-jsx';
import {bindAll, debounce} from 'lodash';

import NodeName, {OPENING, NORMAL_CLOSING, SELF_CLOSING} from './NodeName';

class TreeNode extends Component {
	created() {
		bindAll(
			this,
			'addHighlight',
			'debounceOverlay',
			'focusNode',
			'handleContextMenu',
			'handleInspect',
			'removeHighlight',
			'toggleExpanded'
		);

		this.debounceOverlay = debounce(this.debounceOverlay, 200);

		this._firstRender = true;
	}

	addHighlight() {
		this.toggleHighlight(true);
	}

	debounceOverlay() {
		this.state.showMenu = false;
	}

	focusNode() {
		const {componentNode, onNodeSelect} = this.props;

		onNodeSelect(componentNode.id);
	}

	handleContextMenu(event) {
		event.preventDefault();

		this.state.showMenu = true;
	}

	handleInspect() {
		const {componentNode, onInspectDOM} = this.props;

		onInspectDOM(componentNode.id);
	}

	toggleExpanded(event) {
		event.stopPropagation();

		const {componentNode, onNodeSelect} = this.props;

		const newVal = !this.state.expanded;

		this.state.expanded = newVal;

		onNodeSelect(componentNode.id);
	}

	toggleHighlight(value) {
		const {componentNode, highlightDOM} = this.props;

		if (value) {
			highlightDOM(componentNode.id);
		}
		else {
			highlightDOM(null);
		}

		this.state.highlight = value;
	}

	removeHighlight() {
		this.toggleHighlight(false);
	}

	// TODO: This is sketchy, but currently the best way I have found to automatically
	// expand nodes after it is inspected in the elements pane. Should revisit.
	rendered() {
		const {
			componentNode: {
				containsInspected,
				id
			},
			selectedId
		} = this.props;

		if (containsInspected) {
			this.state.expanded = true;

			delete this.props.componentNode.containsInspected;

			if (id === selectedId) {
				this.element.scrollIntoView();
			}
		}
	}

	render() {
		const {
			props: {
				componentNode: {
					childComponents = [],
					id,
					name
				},
				depth,
				onInspectDOM,
				onNodeSelect,
				selectedId
			},
			state: {
				expanded,
				highlight,
				showMenu
			}
		} = this;

		const hasChildren = childComponents && !!childComponents.length;

		const selected = id === selectedId ? 'selected' : '';

		const highlighted = highlight ? 'highlight' : '';

		const style = `padding-left: ${depth * 24 + 12}px`;

		return (
			<div class="tree-container">
				<div
					class={`node-wrapper ${selected} ${highlighted} ${hasChildren ? 'expandable' : ''}`}
					onClick={expanded ? this.focusNode : this.toggleExpanded}
					onContextMenu={this.handleContextMenu}
					onMouseEnter={this.addHighlight}
					onMouseLeave={this.removeHighlight}
					style={style}
				>
					{hasChildren &&
						<div class={expanded ? 'arrow down' : 'arrow right'} onClick={this.toggleExpanded} />
					}

					<NodeName data-nodeid={id} ref="nodeName" name={name} type={hasChildren ? OPENING : SELF_CLOSING} />

					{showMenu &&
						<div class="overlay" onMouseLeave={this.debounceOverlay}>
							<ul>
								<li onClick={this.handleInspect}>{'Show in Elements Panel'}</li>
							</ul>
						</div>
					}
				</div>

				{hasChildren && expanded &&
					childComponents.map(
						(child, i) => (
							<TreeNode
								componentNode={child}
								depth={this.props.depth + 1}
								key={`${name}-${i}`}
								highlightDOM={this.props.highlightDOM}
								onInspectDOM={onInspectDOM}
								onNodeSelect={onNodeSelect}
								selectedId={selectedId}
							/>
						)
					)
				}

				{hasChildren && expanded &&
					<div
						class={`node-wrapper ${highlighted}`}
						onClick={this.focusNode}
						onMouseEnter={this.addHighlight}
						onMouseLeave={this.removeHighlight}
						style={style}
					>
						<NodeName name={name} type={NORMAL_CLOSING} />
					</div>
				}
			</div>
		);
	}
}

TreeNode.PROPS = {
	componentNode: Config.value({}),
	depth: Config.number().value(0),
	highlightDOM: Config.func(),
	onInspectDOM: Config.func(),
	onNodeSelect: Config.func(),
	selectedId: Config.string()
};

TreeNode.STATE = {
	expanded: Config.value(false),
	highlight: Config.value(false),
	showMenu: Config.value(false)
};

export default TreeNode;
