import React from 'react'
import ReactDOM from 'react-dom'
import actions from './actions'
import isEmpty from 'lodash.isempty'
import 'leaflet'

class App extends React.Component {
	constructor(props, context) {
		super(props, context)
		this.map = null
		this.state = {
			search: [],
			selected: {}
		}
	}

	componentDidMount() {
		this.initMap()
	}

	onSubmit = (e) => {
		e.preventDefault()
		const {value} = this.refs.input

		actions.onSearch(value).end((err, res) => {
			if (err) {
				return console.log(err);
			}
			this.setState({search: res.body})
		})
	}

	onSelect = (selected) => {
		this.setState({
			selected,
			search: []
		})
		console.log({selected});
		this.renderObjectOnMap(selected)
	}

	renderSearchResults = () => {
		const {search} = this.state

		return (
			<div className="search__results">
				{search.map(item =>
					<div className="search__item"
						key={item.place_id}
						onClick={this.onSelect.bind(this, item)}>
						{item.display_name}
					</div>
				)}
			</div>
		)
	}

	initMap = () => {
		this.map = L.map('map').setView([51.505, -0.09], 13)

		L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
			maxZoom: 18,
			attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
				'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
				'Imagery © <a href="http://mapbox.com">Mapbox</a>',
			id: 'mapbox.streets'
		}).addTo(this.map);
	}

	renderObjectOnMap = (obj) => {
		const {boundingbox, geojson, lat, lon} = obj
		const bounds = [
			[boundingbox[0], boundingbox[2]],
			[boundingbox[1], boundingbox[3]]
		]

		this.map.fitBounds(bounds);

		if (!isEmpty(geojson)) {
			var myStyle = {
				// "color": "#ff7800",
				// "weight": 5,
				// "opacity": 0.65
			}

			L.geoJSON([geojson], {style: myStyle}).addTo(this.map);
		}
	}

	renderMap = () => {
		return (
			<div id="map" className="search__map" />
		)
	}

	render () {
		return (
			<div className="search">
				<form className="search__form"
					onSubmit={this.onSubmit}>
					<label>Search:</label>
					<input type="text" ref="input" defaultValue="" />
				</form>
				{this.renderSearchResults()}
				{this.renderMap()}
			</div>
		)
	}
}

ReactDOM.render(<App />, document.getElementById('app'))