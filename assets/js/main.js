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
		if (!search.length) return

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

	renderDetails = () => {
		const {selected} = this.state

		if (isEmpty(selected)) return

		return (
			<div className="search__details">
				<div className="search__details-bg">
					{selected.display_name}
					<p>Class: {selected.class}</p>
					<p>Type: {selected.type}</p>
					<p>Lat/Lon: {selected.lat}/{selected.lon}</p>
					<p>geoJSON type: {selected.geojson.type}</p>
				</div>
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
					<label className="search__label">
						Search:
					</label>
					<input  className="search__input"
						defaultValue=""
						placeholder="Search..."
						ref="input"
						type="text" />
					<input type="submit"
						className="search__submit"
						value="..." />
					{this.renderSearchResults()}
				</form>
				{this.renderDetails()}
				{this.renderMap()}
			</div>
		)
	}
}

ReactDOM.render(<App />, document.getElementById('app'))