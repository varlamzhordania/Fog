"use client"

import {Button, Drawer, Typography} from "@heroui/react";
import Link from "next/link";
import {Menu, Moon, Search, ShoppingCart, Sun, UserRound} from "lucide-react";
import {useConfigStore} from "@/stores/config";
import {useState} from "react";
import Icon from "@/components/Icon/Icon";

const Navbar = () => {
    const {theme, toggleTheme} = useConfigStore(state => state)
    const [isOpen, setIsOpen] = useState(false)

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
                <Link href="/" replace={true}>
                    <Typography type={"span"} className={"font-atomic text-2xl font-bold"}>
                        FOG
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
                    <Icon icon={Search} />
                </Button>
                <Button isIconOnly variant={"ghost"}>
                     <Icon icon={UserRound} />
                </Button>
                <Button isIconOnly variant={"ghost"}>
                     <Icon icon={ShoppingCart} />
                </Button>
                <Button isIconOnly variant={"ghost"} onPress={() => toggleTheme()}>
                    {
                        theme === 'dark' ?  <Icon icon={Sun} /> :  <Icon icon={Moon} />
                    }

                </Button>
            </div>
        </div>

        <Drawer key={"left"}>
            <Drawer.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
                <Drawer.Content placement="left">
                    <Drawer.Dialog>
                        <Drawer.Header className={"border-b-2"}>
                            <Drawer.Heading className={"font-atomic text-center font-bold text-2xl pb-2"}>
                                FOG
                            </Drawer.Heading>
                        </Drawer.Header>
                        <Drawer.Body>
                            <ul className={"list-none flex flex-col gap-2"}>
                                {navigation.map((i, x) => (
                                    <li key={x} className={"w-full p-2 px-4 bg-background rounded-full"}>
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
        </Drawer>
    </header>
}

export default Navbar