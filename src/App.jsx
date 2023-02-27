/*global chrome*/
import { Component } from 'react';
import './App.css';

const utils = {
	timeFormat: (duration) => {
		const date = new Date(null);
		date.setSeconds(duration);

		return date.toISOString().slice(11, 19);
	},

	dateFormat: (timestamp) => {
		return new Date(timestamp).toLocaleDateString();
	},
};

class App extends Component {
	constructor(props) {
		super(props);

		this.handleRowClick = this.handleRowClick.bind(this);
		this.handleRightClick = this.handleRightClick.bind(this);

		this.state = {
			items: [],
		};

		chrome.storage.sync.get().then((items) => {
			for (const key in items) {
				const value = items[key];

				this.state.items.push({
					id: key,
					title: value.title,
					currentTime: value.currentTime,
					duration: value.duration,
					date: value.date,
				});
			}

			this.setState({
				items: [...this.state.items],
			});
		});
	}

	handleRowClick(ev) {
		ev.stopPropagation();

		const target = ev.target;
		const id = target.localName === 'td' ? target.parentElement.id : target.id;
		const item = this.state.items[id];

		if (item) chrome.tabs.create({ url: 'https://www.youtube.com/watch?v=' + item.id });
	}

	handleRightClick(ev) {
		ev.preventDefault();
		ev.stopPropagation();

		const state = this.state;
		const target = ev.target;
		const index = target.localName === 'td' ? target.parentElement.id : target.id;
		const item = state.items[index];

		if (item) {
			state.items.splice(index, 1);
			chrome.storage.sync.remove(item.id); // await?

			this.setState({
				items: [...state.items],
			});
		}
	}

	render() {
		return (
			<div class="container">
				<table>
					<thead>
						<tr>
							<th>Название</th>
							<th>Время</th>
							<th>Дата</th>
						</tr>
					</thead>

					<tbody onClick={this.handleRowClick} onContextMenu={this.handleRightClick}>
						{this.state.items.map((value, idx) => (
							<tr key={`ytb-${idx}`} id={idx}>
								<td>{value.title}</td>
								<td>{utils.timeFormat(value.currentTime)}</td>
								<td>{utils.dateFormat(value.date)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	}
}

export default App;
