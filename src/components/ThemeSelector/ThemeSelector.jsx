import React, { useState, useEffect } from "react";

function ThemeButton(props) {
	const invisible = props.themeName === props.theme ? "" : "invisible";
	console.log(props.themeName === props.theme);
	console.log(props.theme);
	return (
		<button
			className='outline-base-content overflow-hidden rounded-lg text-left'
			data-set-theme={props.themeName}
			onClick={() => props.setTheme(props.themeName)}
			// data-act-class='[&amp;_svg]:visible'
		>
			<span
				data-theme={props.themeName}
				className='bg-base-100 text-base-content block w-full cursor-pointer font-sans'
			>
				<span className='grid grid-cols-5 grid-rows-3'>
					<span className='col-span-5 row-span-3 row-start-1 flex items-center gap-2 px-4 py-3'>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							width='16'
							height='16'
							viewBox='0 0 24 24'
							fill='currentColor'
							className={invisible + " h-3 w-3 shrink-0"}
						>
							<path d='M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z'></path>
						</svg>{" "}
						<span className='flex-grow text-sm'>
							{props.themeName}
						</span>{" "}
						<span className='flex h-full flex-shrink-0 flex-wrap gap-1'>
							<span className='bg-primary w-2 rounded'></span>{" "}
							<span className='bg-secondary w-2 rounded'></span>{" "}
							<span className='bg-accent w-2 rounded'></span>{" "}
							<span className='bg-neutral w-2 rounded'></span>{" "}
						</span>
					</span>
				</span>
			</span>
		</button>
	);
}

function ThemeSelector() {
	const [theme, setTheme] = useState("pastel");
    const themeNames = [
        "light",
        "dark",
        "cupcake",
        "bumblebee",
        "emerald",
        "corporate",
        "synthwave",
        "retro",
        "cyberpunk",
        "valentine",
        "halloween",
        "garden",
        "forest",
        "aqua",
        "lofi",
        "pastel",
        "fantasy",
        "wireframe",
        "black",
        "luxury",
        "dracula",
        "cmyk",
        "autumn",
        "business",
        "acid",
        "lemonade",
        "night",
        "coffee",
        "winter",
    ]
    const themesButtons = []
    themeNames.forEach((value, index) => {
        themesButtons.push(
            <ThemeButton themeName={value} theme={theme} setTheme={setTheme} id={index} />
        )
    })

	// // initially set the theme and "listen" for changes to apply them to the HTML tag
	useEffect(() => {
		document.querySelector("html").setAttribute("data-theme", theme);
	}, [theme]);
	return (
			<div className='dropdown dropdown-bottom'>

				<label tabIndex={0} className='btn m-1'>
                <svg
					xmlns='http://www.w3.org/2000/svg'
					width='16'
					height='16'
					fill='currentColor'
					class='bi bi-brush'
					viewBox='0 0 16 16'
				>
					<path d='M15.825.12a.5.5 0 0 1 .132.584c-1.53 3.43-4.743 8.17-7.095 10.64a6.067 6.067 0 0 1-2.373 1.534c-.018.227-.06.538-.16.868-.201.659-.667 1.479-1.708 1.74a8.118 8.118 0 0 1-3.078.132 3.659 3.659 0 0 1-.562-.135 1.382 1.382 0 0 1-.466-.247.714.714 0 0 1-.204-.288.622.622 0 0 1 .004-.443c.095-.245.316-.38.461-.452.394-.197.625-.453.867-.826.095-.144.184-.297.287-.472l.117-.198c.151-.255.326-.54.546-.848.528-.739 1.201-.925 1.746-.896.126.007.243.025.348.048.062-.172.142-.38.238-.608.261-.619.658-1.419 1.187-2.069 2.176-2.67 6.18-6.206 9.117-8.104a.5.5 0 0 1 .596.04zM4.705 11.912a1.23 1.23 0 0 0-.419-.1c-.246-.013-.573.05-.879.479-.197.275-.355.532-.5.777l-.105.177c-.106.181-.213.362-.32.528a3.39 3.39 0 0 1-.76.861c.69.112 1.736.111 2.657-.12.559-.139.843-.569.993-1.06a3.122 3.122 0 0 0 .126-.75l-.793-.792zm1.44.026c.12-.04.277-.1.458-.183a5.068 5.068 0 0 0 1.535-1.1c1.9-1.996 4.412-5.57 6.052-8.631-2.59 1.927-5.566 4.66-7.302 6.792-.442.543-.795 1.243-1.042 1.826-.121.288-.214.54-.275.72v.001l.575.575zm-4.973 3.04.007-.005a.031.031 0 0 1-.007.004zm3.582-3.043.002.001h-.002z' />
				</svg>
					Theme
				</label>
				<div class='dropdown-content bg-base-200 text-base-content rounded-box top-px max-h-96 w-56 overflow-y-auto shadow scrollbar scrollbar-w-1 scrollbar-thumb-rounded-full scrollbar-thumb-accent'>
					<div class='grid grid-cols-1 gap-3 p-3' tabindex='0'>
                        {themesButtons}
					</div>
				</div>
			</div>
	);
}

export default ThemeSelector;
