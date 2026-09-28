"use client"

import {Button, Drawer, Typography} from "@heroui/react";
import Link from "next/link";
import {Menu, Moon, Search, ShoppingCart, Sun, UserRound} from "lucide-react";
import {useState} from "react";
import Icon from "@/components/Icon/Icon";
import {useThemeStore} from "@/stores/theme";
import {useConfig} from "@/queries/config";
import Image from "@/components/Image";


const Navbar = () => {
    const {theme, toggleTheme} = useThemeStore(state => state)
    const {data: config} = useConfig()
    const [isOpen, setIsOpen] = useState(false)
    const logo = theme === 'dark' ? config.WEBSITE_SECONDARY_ICON : config.WEBSITE_PRIMARY_ICON

    const navigation = [
        {
            title: "Home",
            href: "/",
        },
        {
            title: "Shop",
            href: "/shop",
        },
        {
            title: "Research",
            href: "/research",
        },
        {
            title: "About",
            href: "/about",
        },
    ]

    return <header className={"container sticky"}>
        <div className={"w-full py-4 flex justify-between items-center border-b-2"}>
            <div className={"xl:w-1/3 flex flex-row justify-start items-center gap-2"}>
                <Button isIconOnly variant={"ghost"}
                        className={"lg:hidden"}
                        onPress={() => setIsOpen(prevState => !prevState)}>
                    <Icon icon={Menu}/>
                </Button>


                <Link href="/public" replace={true}
                      className={"flex flex-row gap-2 justify-start items-center"}>
                    {logo && <Image src={logo} width={64} height={64} alt={"FOG LOGO"}
                                  className={"object-cover"}/>}

                    <Typography type={"span"}
                                className={"hidden sm:block font-atomic text-2xl font-bold uppercase"}>
                        fog direct
                    </Typography>
                </Link>
            </div>
            <nav className={"xl:w-1/3 hidden lg:flex flex-row gap-6 justify-center items-center"}>
                {navigation.map((i, x) => (
                    <Link key={x} href={i.href} className={"nav-link"}>
                        {i.title}
                    </Link>
                ))}
            </nav>
            <div className={"xl:w-1/3 flex flex-row justify-end items-center lg:gap-2"}>
                <Button isIconOnly variant={"ghost"}>
                    <Icon icon={Search}/>
                </Button>
                <Button isIconOnly variant={"ghost"}>
                    <Icon icon={UserRound}/>
                </Button>
                <Button isIconOnly variant={"ghost"}>
                    <Icon icon={ShoppingCart}/>
                    <div
                        className={"fixed -top-1 -right-1 flex justify-center items-center bg-foreground ring-2 ring-background rounded-full w-[20px] h-[20px]"}>
                        <Typography
                            type={"small"}
                            className={"text-background"}>
                            4
                        </Typography>
                    </div>

                </Button>
                <Button isIconOnly variant={"ghost"} onPress={() => toggleTheme()}>
                    {
                        theme === 'dark' ? <Icon icon={Sun}/> : <Icon icon={Moon}/>
                    }

                </Button>
            </div>
        </div>

        <Drawer.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
            <Drawer.Content placement="left">
                <Drawer.Dialog>
                    <Drawer.Header className={"border-b-2 border-foreground"}>
                        <Drawer.Heading
                            className={"font-atomic text-center font-bold text-2xl uppercase pb-2"}>
                            fog direct
                        </Drawer.Heading>
                    </Drawer.Header>
                    <Drawer.Body>
                        <ul className={"list-none flex flex-col gap-2"}>
                            {navigation.map((i, x) => (
                                <li key={x}
                                    className={"w-full flex justify-between items-center p-2 px-4 border-b"}>
                                    <Link href={i.href} className={"nav-link"}>
                                        {i.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Drawer.Body>
                    <Drawer.Footer>
                    </Drawer.Footer>
                </Drawer.Dialog>
            </Drawer.Content>
        </Drawer.Backdrop>
    </header>
}

export default Navbar