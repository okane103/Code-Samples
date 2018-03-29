import React from 'react';
import { Parallax, Background } from 'react-parallax';
import { render } from 'react-dom';
import { Fade } from 'react-bootstrap';
import { React_Bootstrap_Carousel } from 'react-bootstrap-carousel';

class ParallaxImg extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            fadeInReady: false,
            updateFadeInReady: null
        }
    }

    componentDidMount() {
        this.setState({ updateFadeInReady: setInterval(() => this.setState({ fadeInReady: true }), 500) })
    }

    componentWillUnmount() {
        clearInterval(this.state.updateFadeInReady)
    }

    render() {
        const newImages = this.props.slides.map(items => {
            return (
                <div style={{ backgroundColor: '#fff' }} key={items.title}>
                    <Fade in={this.state.fadeInReady}>
                        <div>
                            <Parallax strength={400} bgImage={items.background}>
                                <div className="parallaxContainer" >
                                </div>
                                <Background>
                                    <div className="parallaxBackground">
                                        <div className="display-table">
                                            <div className="display-table-cell vertical-align-middle">
                                                <div className="container text-center"
                                                    style={{ width: '100vw' }}>
                                                    <h1 
                                                        className='nomargin size-50 weight-400 fadeInUp animated text-white'
                                                        style={{
                                                            visibility: 'visible',
                                                            animationDelay: '0.4s',
                                                            animationName: 'fadeInUp'
                                                            }}
                                                    >
                                                        {items.title}
                                                    </h1>
                                                    <p 
                                                        className="lead size-25 weight-300 fadeInUp animated text-white"
                                                        style={{
                                                            visibility: 'visible',
                                                            animationDelay: '0.7s',
                                                            animationName: 'fadeInUp'
                                                            }}
                                                    >
                                                        {items.tagline}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Background>
                            </Parallax >
                        </div>
                    </Fade>
                </div>
            )
        })
        return (
            <React_Bootstrap_Carousel
                autoPlay={true}
                slideshowSpeed={3500}
            >
                {newImages || ""}

            </React_Bootstrap_Carousel>
        )
    }
}

export default ParallaxImg;